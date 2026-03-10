Container(
  width: 300,
  height: 200,
  decoration: BoxDecoration(
    gradient: LinearGradient(
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
      colors: [AppColors.gradientStart, AppColors.gradientEnd],
      stops: [0, 1],
    ),
    borderRadius: BorderRadius.all(Radius.circular(16)),
  ),
)
