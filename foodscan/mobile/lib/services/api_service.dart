import 'dart:io';
import 'package:dio/dio.dart';
import '../models/predict_models.dart';

class ApiService {
  final Dio _dio;

  // IMPORTANT:
  // Android emulator uses 10.0.2.2 to reach your PC localhost.
  // iOS simulator can use 127.0.0.1.
  // Real phone needs your PC LAN IP (like 192.168.x.x) + same WiFi.
  static const String baseUrlAndroidEmulator = "http://10.0.2.2:8000";
  static const String baseUrlLocalhost = "http://127.0.0.1:8000";

  ApiService({String? baseUrl})
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl ?? baseUrlAndroidEmulator,
          connectTimeout: const Duration(seconds: 20),
          receiveTimeout: const Duration(seconds: 60),
        ));

  Future<PredictSingleResponse> predictSingle(File imageFile) async {
    final fileName = imageFile.path.split(Platform.pathSeparator).last;

    final formData = FormData.fromMap({
      "image": await MultipartFile.fromFile(imageFile.path, filename: fileName),
      "mode": "single",
    });

    final res = await _dio.post(
      "/predict",
      data: formData,
      options: Options(contentType: "multipart/form-data"),
    );

    return PredictSingleResponse.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> feedbackSingle({
    required String scanId,
    required String chosenLabel,
    String? rawText,
  }) async {
    await _dio.post(
      "/feedback/single",
      data: {
        "scan_id": scanId,
        "chosen_label": chosenLabel,
        "raw_text": rawText,
      },
      options: Options(contentType: "application/json"),
    );
  }
}