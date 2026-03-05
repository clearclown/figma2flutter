Column(
  mainAxisSize: MainAxisSize.min,
  children: [
    Text(
      'Visible',
      style: AppTypography.bodyMd.copyWith(
        color: AppColors.textPrimary,
      ),
      textAlign: TextAlign.left,
    ),
    SizedBox(height: 8),
    Opacity(
      opacity: 0.5,
      child: Text(
        'Semi-transparent',
        style: AppTypography.bodyMd.copyWith(
          color: AppColors.textPrimary,
        ),
        textAlign: TextAlign.left,
      ),
    ),
  ],
)
