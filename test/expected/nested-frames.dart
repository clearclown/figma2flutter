Column(
  mainAxisSize: MainAxisSize.min,
  crossAxisAlignment: CrossAxisAlignment.stretch,
  children: [
    Text(
      'Section Title',
      style: AppTypography.headingMd.copyWith(
        color: AppColors.textPrimary,
      ),
      textAlign: TextAlign.left,
    ),
    SizedBox(height: 12),
    Row(
      mainAxisAlignment: MainAxisAlignment.end,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          'Edit',
          style: AppTypography.bodySm.copyWith(
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.left,
        ),
        SizedBox(width: 8),
        Text(
          'Delete',
          style: AppTypography.bodySm.copyWith(
            color: AppColors.textSecondary,
          ),
          textAlign: TextAlign.left,
        ),
      ],
    ),
  ],
)
