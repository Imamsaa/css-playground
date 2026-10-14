# ICT Al Firdaus Purwodadi — CSS Coding Playground

Playground interaktif untuk latihan CSS Selector, Color, Background, Border, dan Margin bagi siswa ICT Class.

## Kurikulum: 48 tugas bertahap

### 1. CSS Selector — tugas 1–12

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

Rujukan:
- [CSS Selectors](https://www.w3schools.com/css/css_selectors.asp)
- [Grouping and Universal Selectors](https://www.w3schools.com/css/css_selectors_grouping.asp)
- [CSS Combinators](https://www.w3schools.com/css/css_combinators.asp)
- [CSS Attribute Selectors](https://www.w3schools.com/css/css_attribute_selectors.asp)
- [CSS Pseudo-classes](https://www.w3schools.com/css/css_pseudo_classes.asp)

### 2. Color — tugas 13–20

13. Color Name
14. Color HEX
15. Color RGB
16. Color HSL
17. Color RGBA
18. Color HEXA
19. Color HSLA
20. Opacity

Rujukan:
- [CSS Colors](https://www.w3schools.com/css/css_colors.asp)
- [CSS Color Values](https://www.w3schools.com/css/css3_colors.asp)

### 3. Background — tugas 21–29

21. Background Color
22. Background pada Kartu
23. Background Image
24. Background Repeat
25. Background Repeat Y
26. Background Position
27. Background Size
28. Background Shorthand
29. Background Attachment

Rujukan:
- [CSS Backgrounds](https://www.w3schools.com/css/css_background.asp)
- [CSS Background Image](https://www.w3schools.com/css/css_background_image.asp)
- [CSS Background Repeat](https://www.w3schools.com/css/css_background_repeat.asp)
- [CSS Background Attachment](https://www.w3schools.com/css/css_background_attachment.asp)
- [CSS Background Shorthand](https://www.w3schools.com/css/css_background_shorthand.asp)

### 4. Border — tugas 30–39

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

Rujukan:
- [CSS Border Style](https://www.w3schools.com/css/css_border.asp)
- [CSS Border Width](https://www.w3schools.com/css/css_border_width.asp)
- [CSS Border Color](https://www.w3schools.com/css/css_border_color.asp)
- [CSS Border Sides](https://www.w3schools.com/css/css_border_sides.asp)
- [CSS Border Shorthand](https://www.w3schools.com/css/css_border_shorthand.asp)
- [CSS Rounded Borders](https://www.w3schools.com/css/css_border_rounded.asp)

### 5. Margin — tugas 40–48

40. Margin Sides
41. Margin Shorthand: 4 Nilai
42. Margin Shorthand: 3 Nilai
43. Margin Shorthand: 2 Nilai
44. Margin Shorthand: 1 Nilai
45. Margin Auto: Center
46. Margin Inherit
47. Margin Persentase
48. Negative Margin

Rujukan:
- [CSS Margins](https://www.w3schools.com/css/css_margin.asp)

## Fitur

- Editor CSS dengan live preview yang memperbarui CSS saat siswa mengetik.
- Panel struktur HTML bertingkat menampilkan tag, class, ID, dan hubungan induk-anak. Klik tag, class, atau ID untuk menambahkan selector ke editor.
- Pemeriksaan otomatis atas selector dan computed styles di browser.
- Pemeriksaan properti Color, Background, Border, dan Margin sesuai tujuan masing-masing tugas.
- Tautan materi W3Schools pada tugas yang relevan.
- Progres lokal disimpan di browser siswa.
- Fitur akun siswa untuk membuat kode akun, memulihkan pengerjaan lintas perangkat, dan menyinkronkan kode CSS serta tugas selesai ke database JSON privat.
- Tautan langsung ke tugas melalui parameter URL `?task=<id>`.

## Akun siswa dan database JSON

Fitur akun memakai backend Google Apps Script sebagai API server, tetapi **tidak menggunakan Google Drive untuk menyimpan data**.

- Data akun/progres ada di `data/accounts.json` pada branch `student-data` di repositori yang sama.
- Karena repositori bersifat publik, isi JSON dienkripsi di server. Nama, kode akun, dan progres tidak disimpan sebagai teks terbaca.
- Token GitHub serta kunci enkripsi hanya disimpan di Script Properties Apps Script, bukan di frontend.
- Ikuti panduan [backend/README.md](backend/README.md) untuk mengonfigurasi token, men-deploy API, dan memasukkan URL `/exec` ke `ACCOUNT_API_URL` di `index.html`.

## Menjalankan

Buka `index.html` di browser atau aktifkan GitHub Pages dari Settings → Pages, pilih branch `main` dan folder `/ (root)`.

Catatan: sebelum URL backend dimasukkan, playground tetap berfungsi dengan penyimpanan lokal saja. Sinkronisasi lintas perangkat belum aktif sampai backend dikonfigurasi. Preview memuat gambar contoh dari W3Schools melalui URL HTTPS.
