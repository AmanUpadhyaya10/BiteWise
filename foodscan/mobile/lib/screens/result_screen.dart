import 'dart:io';
import 'package:flutter/material.dart';
import '../models/predict_models.dart';
import '../services/api_service.dart';

class ResultScreen extends StatefulWidget {
  final File imageFile;
  final PredictSingleResponse prediction;

  const ResultScreen({
    super.key,
    required this.imageFile,
    required this.prediction,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  final ApiService _api = ApiService();
  bool _sending = false;

  String? _selectedLabel;
  String? _statusText;

  @override
  void initState() {
    super.initState();

    if (!widget.prediction.needsUser && widget.prediction.chosen != null) {
      _selectedLabel = widget.prediction.chosen!.label;
      _statusText = "Auto-detected";
    } else {
      _statusText = widget.prediction.message ?? "Select the correct food";
    }
  }

  String prettyLabel(String label) {
    final parts = label.split('_').map((p) {
      if (p.isEmpty) return p;
      return p[0].toUpperCase() + p.substring(1);
    }).toList();
    return parts.join(' ');
  }

  String confPct(double c) => "${(c * 100).toStringAsFixed(1)}%";

  Future<void> _submitFeedback(String chosen) async {
    setState(() {
      _sending = true;
      _statusText = "Saving feedback...";
    });

    try {
      await _api.feedbackSingle(
        scanId: widget.prediction.scanId,
        chosenLabel: chosen,
        rawText: null,
      );

      setState(() {
        _sending = false;
        _statusText = "Saved ✅";
      });
    } catch (e) {
      setState(() {
        _sending = false;
        _statusText = "Failed to save feedback ❌";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.prediction;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Result"),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Image.file(
                widget.imageFile,
                height: 220,
                width: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            const SizedBox(height: 16),

            if (_statusText != null)
              Text(
                _statusText!,
                style: const TextStyle(fontSize: 14),
              ),
            const SizedBox(height: 12),

            const Text(
              "Predictions",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 10),

            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: p.topK.map((item) {
                final selected = _selectedLabel == item.label;
                return ChoiceChip(
                  label: Text("${prettyLabel(item.label)} • ${confPct(item.confidence)}"),
                  selected: selected,
                  onSelected: _sending
                      ? null
                      : (val) {
                          setState(() {
                            _selectedLabel = item.label;
                            _statusText = "Selected: ${prettyLabel(item.label)}";
                          });
                        },
                );
              }).toList(),
            ),

            const SizedBox(height: 18),

            ElevatedButton(
              onPressed: (_sending || _selectedLabel == null)
                  ? null
                  : () async {
                      await _submitFeedback(_selectedLabel!);
                    },
              child: _sending
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text("Confirm"),
            ),

            const SizedBox(height: 18),

            if (p.nutrition != null) ...[
              const Text(
                "Nutrition (approx.)",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 10),
              _nutritionCard(p.nutrition!),
            ] else ...[
              const Text(
                "Nutrition will appear when model is confident (or after you confirm).",
                style: TextStyle(fontSize: 13),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _nutritionCard(Nutrition n) {
    Widget row(String k, String v) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(k, style: const TextStyle(fontSize: 14)),
            Text(v, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          ],
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            row("Calories", n.kcal != null ? "${n.kcal!.toStringAsFixed(0)} kcal" : "N/A"),
            row("Protein",  n.protein != null ? "${n.protein!.toStringAsFixed(1)} g" : "N/A"),
            row("Carbs",    n.carbs != null ? "${n.carbs!.toStringAsFixed(1)} g" : "N/A"),
            row("Fat",      n.fat != null ? "${n.fat!.toStringAsFixed(1)} g" : "N/A"),
          ],
        ),
      ),
    );
  }
}