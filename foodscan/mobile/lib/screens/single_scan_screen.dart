import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../services/api_service.dart';
import 'result_screen.dart';

class SingleScanScreen extends StatefulWidget {
  const SingleScanScreen({super.key});

  @override
  State<SingleScanScreen> createState() => _SingleScanScreenState();
}

class _SingleScanScreenState extends State<SingleScanScreen> {
  final ApiService _api = ApiService();
  final ImagePicker _picker = ImagePicker();
  bool _loading = false;

  Future<void> _pickAndPredict() async {
    final XFile? xfile = await _picker.pickImage(source: ImageSource.gallery);
    if (xfile == null) return;

    final file = File(xfile.path);

    setState(() => _loading = true);
    try {
      final pred = await _api.predictSingle(file);
      if (!mounted) return;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ResultScreen(imageFile: file, prediction: pred),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Predict failed: $e")),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Single Item Scan")),
      body: Center(
        child: _loading
            ? const CircularProgressIndicator()
            : ElevatedButton(
                onPressed: _pickAndPredict,
                child: const Text("Pick Image & Predict"),
              ),
      ),
    );
  }
}
