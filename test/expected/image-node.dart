ClipRRect(
  borderRadius: BorderRadius.only(topLeft: Radius.circular(12), topRight: Radius.circular(12)),
  child: Image.asset(
    'assets/images/hero-image.png',
    width: 300,
    height: 200,
    fit: BoxFit.cover,
  ),
)
