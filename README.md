# ICT Al Firdaus Purwodadi — CSS Coding Playground

Playground interaktif untuk latihan CSS secara bertahap. Siswa menulis CSS sendiri, melihat live preview, membaca struktur HTML tugas, dan mengecek hasil melalui computed style browser.

## Kurikulum: 60 tugas bertahap

### CSS Selector — tugas 1–12

1. Selector Elemen
2. Universal Selector
3. Selector ID
4. Selector Class
5. Selector Tag + Class
6. Selector Gabungan
7. Descendant Selector
8. Child Combinator
9. Adjacent Sibling
10. General Sibling
11. Attribute Selector
12. Pseudo-class :hover

Materi rujukan:
- [CSS Selectors](https://www.w3schools.com/css/css_selectors.asp)
- [Grouping Selectors](https://www.w3schools.com/css/css_selectors_grouping.asp)
- [CSS Combinators](https://www.w3schools.com/css/css_combinators.asp)
- [Attribute Selectors](https://www.w3schools.com/css/css_attribute_selectors.asp)
- [Pseudo-classes](https://www.w3schools.com/css/css_pseudo_classes.asp)

### Color — tugas 13–20

13. Color Name
14. Color HEX
15. Color RGB
16. Color HSL
17. Color RGBA
18. Color HEXA
19. Color HSLA
20. Opacity

Materi rujukan:
- [CSS Colors](https://www.w3schools.com/css/css_colors.asp)
- [CSS Color Values (RGB/HEX/HSL)](https://www.w3schools.com/css/css3_colors.asp)

### Background — tugas 21–29

21. Background Color
22. Background pada Kartu
23. Background Image
24. Background Repeat
25. Background Repeat Y
26. Background Position
27. Background Size
28. Background Shorthand
29. Background Attachment

Materi rujukan:
- [Background Color](https://www.w3schools.com/css/css_background.asp)
- [Background Image](https://www.w3schools.com/css/css_background_image.asp)
- [Background Repeat](https://www.w3schools.com/css/css_background_repeat.asp)
- [Background Attachment](https://www.w3schools.com/css/css_background_attachment.asp)
- [Background Shorthand](https://www.w3schools.com/css/css_background_shorthand.asp)

### Border — tugas 30–39

30. Border Style
31. Border Style per Sisi
32. Border Width
33. Border Width per Sisi
34. Border Color
35. Border Color per Sisi
36. Border Sides
37. Border Shorthand
38. Rounded Border
39. Border Radius per Sudut

Materi rujukan:
- [Border Style](https://www.w3schools.com/css/css_border.asp)
- [Border Width](https://www.w3schools.com/css/css_border_width.asp)
- [Border Color](https://www.w3schools.com/css/css_border_color.asp)
- [Border Sides](https://www.w3schools.com/css/css_border_sides.asp)
- [Border Shorthand](https://www.w3schools.com/css/css_border_shorthand.asp)
- [Rounded Borders](https://www.w3schools.com/css/css_border_rounded.asp)

### Margin — tugas 40–48

40. Margin Sides
41. Margin Shorthand: 4 Nilai
42. Margin Shorthand: 3 Nilai
43. Margin Shorthand: 2 Nilai
44. Margin Shorthand: 1 Nilai
45. Margin Auto: Center
46. Margin Inherit
47. Margin Persentase
48. Negative Margin

Materi rujukan:
- [CSS Margins](https://www.w3schools.com/css/css_margin.asp)

### Padding — tugas 49–54

49. Padding Sides
50. Padding Shorthand: 4 Nilai
51. Padding Shorthand: 3 Nilai
52. Padding Shorthand: 2 Nilai
53. Padding Shorthand: 1 Nilai
54. Padding dan Box-sizing

Materi rujukan:
- [CSS Padding](https://www.w3schools.com/css/css_padding.asp)
- [Padding and box-sizing](https://www.w3schools.com/css/css_padding_box-sizing.asp)

### Width & Height — tugas 55–58

55. Width dan Height
56. Width Persentase
57. Min-width dan Max-width
58. Min-height dan Max-height

Materi rujukan:
- [Height and Width](https://www.w3schools.com/css/css_height_width.asp)
- [Min/Max Height and Width](https://www.w3schools.com/css/css_height_width_min_max.asp)

### Box Model — tugas 59–60

59. Box Model: Content-box
60. Box Model: Border-box

Materi rujukan:
- [CSS Box Model](https://www.w3schools.com/css/css_boxmodel.asp)

## Fitur

- Editor CSS dengan live preview yang memperbarui CSS saat siswa mengetik.
- Panel struktur HTML bertingkat menampilkan tag, class, ID, dan hubungan induk-anak. Klik tag, class, atau ID untuk menambahkan selector ke editor.
- Pemeriksaan otomatis atas selector dan computed styles di browser.
- Latihan Color, Background, Border, Margin, Padding, Width/Height, dan Box Model.
- Tautan materi W3Schools pada setiap tugas yang relevan.
- Kode CSS dan progres tugas disimpan secara lokal di browser siswa.
- Tautan langsung ke tugas melalui parameter URL `?task=<id>`.

## Penyimpanan progres

Playground menggunakan `localStorage` untuk menyimpan kode CSS dan progres pada browser yang sedang digunakan. Data tidak dikirim ke server. Jika siswa berpindah browser atau perangkat, data lokal tidak ikut berpindah.

## Menjalankan

Buka `index.html` di browser atau aktifkan GitHub Pages dari Settings → Pages, pilih branch `main` dan folder `/ (root)`.

Catatan: preview memuat gambar contoh dari W3Schools melalui URL HTTPS.
