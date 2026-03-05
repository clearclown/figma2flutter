RichText(
  textAlign: TextAlign.left,
  text: TextSpan(
    style: AppTypography.bodyMd.copyWith(
      color: AppColors.textPrimary,
    ),
    children: [
      TextSpan(
        text: '利用規約',
        style: AppTypography.bodyMdBold.copyWith(
          color: AppColors.textAccent,
        ),
      ),
      TextSpan(
        text: 'に同意します',
        style: AppTypography.bodyMd.copyWith(
          color: AppColors.textPrimary,
        ),
      ),
    ],
  ),
)
