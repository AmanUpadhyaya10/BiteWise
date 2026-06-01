#!/usr/bin/env python3
"""
Event-Driven Auto-Retrain Monitor for Bitewise
Monitors training data folder and triggers retraining when threshold is reached
"""

import os
os.environ['PYTHONIOENCODING'] = 'utf-8'

import json
import time
import logging
import subprocess
import sys
from pathlib import Path
from datetime import datetime, timedelta

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────────────────────────────────────

BACKEND_DIR = Path(__file__).parent
TRAIN_DIR = BACKEND_DIR / "app/storage/dataset/train"
CONFIG_FILE = BACKEND_DIR / "retrain_config.json"
RETRAIN_SCRIPT = BACKEND_DIR / "retrain.py"
LOG_FILE = BACKEND_DIR / "monitor.log"

print(f"BACKEND_DIR: {BACKEND_DIR}")
print(f"CONFIG_FILE: {CONFIG_FILE}")
print(f"TRAIN_DIR: {TRAIN_DIR}")

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s: %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

def load_config():
    """Load config from JSON"""
    logger.info(f"Attempting to load config from: {CONFIG_FILE}")
    logger.info(f"File exists: {CONFIG_FILE.exists()}")
    
    if not CONFIG_FILE.exists():
        logger.error(f"Config file not found: {CONFIG_FILE}")
        return None
    
    try:
        logger.info("Opening config file...")
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            logger.info(f"File content length: {len(content)} bytes")
            
            if not content.strip():
                logger.error("Config file is empty!")
                return None
            
            data = json.loads(content)
            logger.info(f"Config loaded successfully: {data}")
            return data
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in config: {e}")
        return None
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def save_config(config):
    """Save config to JSON"""
    try:
        with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
            json.dump(config, f, indent=2)
        logger.info(f"Config saved to {CONFIG_FILE}")
    except Exception as e:
        logger.error(f"Failed to save config: {e}")

# ─────────────────────────────────────────────────────────────────────────────
# IMAGE COUNTING
# ─────────────────────────────────────────────────────────────────────────────

def count_training_images():
    """Count total images in training directory"""
    if not TRAIN_DIR.exists():
        logger.warning(f"TRAIN_DIR not found: {TRAIN_DIR}")
        return 0
    
    count = 0
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.webp']:
        count += len(list(TRAIN_DIR.glob(f"**/{ext}")))
    
    logger.debug(f"Found {count} images in {TRAIN_DIR}")
    return count

# ─────────────────────────────────────────────────────────────────────────────
# RETRAINING TRIGGER
# ─────────────────────────────────────────────────────────────────────────────

def should_retrain(config, current_count):
    """Check if retraining should be triggered"""
    
    if not config.get('enabled', False):
        return False, "Retraining disabled"
    
    threshold = config.get('images_threshold', 10)
    last_count = config.get('last_image_count', 0)
    last_retrain = config.get('last_retrain_time')
    
    new_images = current_count - last_count
    
    # Check if threshold reached
    if new_images < threshold:
        return False, f"Need {threshold - new_images} more images ({current_count}/{threshold})"
    
    # Check cooldown (prevent retraining too frequently)
    if last_retrain:
        try:
            last_time = datetime.fromisoformat(last_retrain)
            cooldown = timedelta(hours=1)  # Wait 1 hour between retrains
            if datetime.now() - last_time < cooldown:
                return False, "Cooldown period active (1 hour between retrains)"
        except Exception as e:
            logger.warning(f"Error parsing last_retrain_time: {e}")
    
    return True, f"Threshold reached! {new_images} new images added"

def run_retrain():
    """Execute retraining script"""
    logger.info("=" * 80)
    logger.info("TRIGGERING RETRAINING...")
    logger.info("=" * 80)
    
    try:
        result = subprocess.run(
            ["python", str(RETRAIN_SCRIPT)],
            cwd=str(BACKEND_DIR),
            capture_output=True,
            text=True,
            timeout=3600  # 1 hour timeout
        )
        
        logger.info(f"Return code: {result.returncode}")
        
        if result.stdout:
            logger.info("STDOUT:")
            logger.info(result.stdout)
        
        if result.stderr:
            logger.info("STDERR:")
            logger.info(result.stderr)
        
        if result.returncode == 0:
            logger.info("OK - Retraining completed successfully")
            return True
        else:
            logger.error("FAILED - Retraining returned non-zero exit code")
            return False
    
    except subprocess.TimeoutExpired:
        logger.error("FAILED - Retraining timed out (1 hour limit exceeded)")
        return False
    except Exception as e:
        logger.error(f"FAILED - Could not run retraining: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

# ─────────────────────────────────────────────────────────────────────────────
# MAIN MONITORING LOOP
# ─────────────────────────────────────────────────────────────────────────────

def monitor():
    """Main monitoring loop"""
    logger.info("=" * 80)
    logger.info("Starting Bitewise Retraining Monitor")
    logger.info("=" * 80)
    
    config = load_config()
    if not config:
        logger.error("Failed to load config. Exiting.")
        return False
    
    check_interval = config.get('check_interval_seconds', 300)  # 5 minutes default
    threshold = config.get('images_threshold', 10)
    
    logger.info("Configuration loaded successfully:")
    logger.info(f"  Threshold: {threshold} images")
    logger.info(f"  Check interval: {check_interval} seconds ({check_interval/60:.1f} minutes)")
    logger.info(f"  Training directory: {TRAIN_DIR}")
    logger.info(f"  Enabled: {config.get('enabled', False)}")
    logger.info("")
    
    iteration = 0
    
    try:
        while True:
            iteration += 1
            current_count = count_training_images()
            should_train, reason = should_retrain(config, current_count)
            
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logger.info(f"[Check #{iteration} @ {timestamp}] {current_count} images | {reason}")
            
            if should_train:
                # Run retraining
                if run_retrain():
                    # Update config
                    config['last_image_count'] = current_count
                    config['last_retrain_time'] = datetime.now().isoformat()
                    save_config(config)
                    logger.info(f"Updated config: last_image_count={current_count}, last_retrain_time={config['last_retrain_time']}")
                else:
                    logger.warning("Retraining failed, will retry at next check")
            
            # Wait before next check
            logger.debug(f"Sleeping for {check_interval} seconds...")
            time.sleep(check_interval)
    
    except KeyboardInterrupt:
        logger.info("Monitor stopped by user (Ctrl+C)")
        return True
    except Exception as e:
        logger.error(f"Monitor crashed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

# ─────────────────────────────────────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    success = monitor()
    sys.exit(0 if success else 1)