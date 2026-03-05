class RestaurantCard extends StatelessWidget {
  const RestaurantCard({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 343,
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
      padding: EdgeInsets.only(bottom: 16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Image.asset(
            'assets/images/restaurant-hero.png',
            width: 343,
            height: 180,
            fit: BoxFit.cover,
          ),
          Padding(
            padding: EdgeInsets.only(top: 12, right: 16, left: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'トラットリア・ダ・フェリーチェ',
                  style: AppTypography.headingLg.copyWith(
                    color: AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.left,
                ),
                SizedBox(height: 8),
                Text(
                  '渋谷区 • イタリアン • ¥¥',
                  style: AppTypography.bodyMd.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.left,
                ),
                SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      '★ 4.5',
                      style: AppTypography.bodyMd.copyWith(
                        color: AppColors.textPrimary,
                      ),
                      textAlign: TextAlign.left,
                    ),
                    Container(
                      height: 36,
                      decoration: BoxDecoration(
                        color: AppColors.primary500,
                        borderRadius: BorderRadius.all(Radius.circular(8)),
                      ),
                      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Text(
                            '予約する',
                            style: AppTypography.labelMd.copyWith(
                              color: AppColors.textOnPrimary,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
