SizedBox(
  width: 200,
  height: 200,
  child: Stack(
    children: [
      Positioned(
        left: 0,
        top: 0,
        child: Container(
          width: 200,
          height: 200,
          decoration: BoxDecoration(
            color: AppColors.backgroundDark,
          ),
        ),
      ),
      Positioned(
        left: 20,
        top: 80,
        child: Text(
          'Overlay Text',
          style: AppTypography.bodyMd.copyWith(
            color: AppColors.textWhite,
          ),
          textAlign: TextAlign.left,
        ),
      ),
    ],
  ),
)
