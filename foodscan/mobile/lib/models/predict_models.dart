class PredictionItem {
  final String label;
  final double confidence;

  PredictionItem({required this.label, required this.confidence});

  factory PredictionItem.fromJson(Map<String, dynamic> json) {
    return PredictionItem(
      label: json['label'] as String,
      confidence: (json['confidence'] as num).toDouble(),
    );
  }
}

class Nutrition {
  final double? kcal;
  final double? protein;
  final double? carbs;
  final double? fat;

  Nutrition({
    this.kcal,
    this.protein,
    this.carbs,
    this.fat,
  });

  factory Nutrition.fromJson(Map<String, dynamic> json) {
    return Nutrition(
      kcal: (json['kcal'] as num?)?.toDouble(),
      protein: (json['protein'] as num?)?.toDouble(),
      carbs: (json['carbs'] as num?)?.toDouble(),
      fat: (json['fat'] as num?)?.toDouble(),
    );
  }
}

class PredictSingleResponse {
  final String scanId;
  final bool needsUser;
  final List<PredictionItem> topK;
  final PredictionItem? chosen;
  final Nutrition? nutrition;
  final String? message;

  PredictSingleResponse({
    required this.scanId,
    required this.needsUser,
    required this.topK,
    required this.chosen,
    required this.nutrition,
    required this.message,
  });

  factory PredictSingleResponse.fromJson(Map<String, dynamic> json) {
    return PredictSingleResponse(
      scanId: json['scan_id'] as String,
      needsUser: json['needs_user'] as bool,
      topK: (json['top_k'] as List)
          .map((e) => PredictionItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      chosen: json['chosen'] == null
          ? null
          : PredictionItem.fromJson(json['chosen'] as Map<String, dynamic>),
      nutrition: json['nutrition'] == null
          ? null
          : Nutrition.fromJson(json['nutrition'] as Map<String, dynamic>),
      message: json['message'] as String?,
    );
  }
}