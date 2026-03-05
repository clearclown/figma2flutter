Container(
  width: 350,
  decoration: BoxDecoration(
    color: AppColors.surfaceWhite,
    borderRadius: BorderRadius.all(Radius.circular(12)),
  ),
  padding: EdgeInsets.all(16),
  child: Column(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      Text(
        'Restaurant Name',
        style: AppTypography.headingMd.copyWith(
          color: AppColors.textPrimary,
        ),
        textAlign: TextAlign.left,
      ),
      SizedBox(height: 8),
      Text(
        '渋谷区 • イタリアン',
        style: AppTypography.bodySm.copyWith(
          color: AppColors.textSecondary,
        ),
        textAlign: TextAlign.left,
      ),
    ],
  ),
)
