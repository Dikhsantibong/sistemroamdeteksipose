# MASTER PROMPT — SELF PHOTO BOOTH POSE ASSISTANT

## INSTRUKSI UTAMA

Saya ingin membangun aplikasi **Self Photo Booth Pose Assistant** menggunakan Laravel.

**WAJIB membaca dan mengikuti seluruh aturan, arsitektur, coding convention, struktur folder, teknologi, dependency, dan instruksi yang terdapat pada `@CLAUDE.md`.**

`@CLAUDE.md` adalah **source of truth utama untuk implementasi project ini**.

Jangan mengganti, mengabaikan, atau mengasumsikan teknologi yang bertentangan dengan `@CLAUDE.md`.

Jika terdapat konflik antara prompt ini dengan `@CLAUDE.md`, ikuti aturan yang ditentukan oleh `@CLAUDE.md`, kecuali saya secara eksplisit meminta perubahan.

---

# 1. TUJUAN PROJECT

Project ini adalah sistem pendamping untuk bisnis **self photo booth**.

Pada self photo booth, customer berfoto menggunakan kamera utama mereka.

Aplikasi yang sedang dibuat **tidak mengambil foto customer**.

Aplikasi hanya berjalan pada sebuah tablet Android yang ditempatkan di samping atau di atas kamera utama.

Fungsi tablet:

1. Mendeteksi jumlah orang yang berada di dalam frame.
2. Menentukan jumlah orang yang sedang berfoto.
3. Mengambil rekomendasi pose berdasarkan jumlah orang.
4. Menampilkan foto referensi pose.
5. Memungkinkan customer berpindah ke pose berikutnya.
6. Navigasi pose menggunakan hand gesture.
7. Navigasi pose menggunakan voice command.
8. Menyediakan tombol manual sebagai fallback.

---

# 2. BATASAN PENTING

Aplikasi **TIDAK BOLEH**:

- mengambil foto customer
- menyimpan foto customer
- meng-upload foto customer
- merekam video customer
- menyimpan frame kamera
- mengakses kamera utama self photo booth
- mengontrol shutter kamera
- terhubung ke DSLR
- terhubung ke mirrorless
- mengontrol perangkat kamera eksternal

Kamera tablet hanya digunakan untuk:

```text
Person Detection
Hand Gesture Detection
```

Tidak ada fitur photo capture.

---

# 3. TECHNOLOGY

Gunakan Laravel sebagai framework utama.

Teknologi frontend, backend, database, CSS, JavaScript, build system, authentication, dan library lainnya harus mengikuti:

```text
@CLAUDE.md
```

Jangan menambahkan framework atau library baru jika tidak diperlukan.

Jika suatu library memang diperlukan untuk fungsi tertentu, jelaskan alasan penggunaannya terlebih dahulu.

---

# 4. TARGET PLATFORM

Target utama:

```text
Android Tablet
PWA
Landscape
Touch Screen
```

Aplikasi harus dapat berjalan melalui browser modern yang mendukung PWA.

Target browser utama:

```text
Google Chrome Android
```

---

# 5. PWA

Aplikasi harus dibuat sebagai Progressive Web App.

PWA harus memiliki:

- manifest
- service worker
- application shell
- offline caching
- installability
- update mechanism
- responsive tablet layout
- standalone mode
- landscape orientation

---

# 6. ROUTE UTAMA

Buat pemisahan halaman:

```text
/install
/booth
/admin
```

## `/install`

Halaman khusus untuk menginstall PWA.

## `/booth`

Halaman aplikasi utama yang digunakan pada tablet self photo booth.

## `/admin`

Dashboard untuk administrator mengelola seluruh konten dan konfigurasi.

---

# 7. INSTALL PAGE

Buat halaman:

```text
/install
```

Halaman ini bersifat public.

Tujuannya adalah memudahkan operator menginstall PWA tanpa harus melakukan konfigurasi teknis.

Contoh flow:

```text
Operator
    ↓
Buka /install
    ↓
Browser Android
    ↓
Install App
    ↓
PWA terinstall
    ↓
Open Booth
    ↓
/booth
```

---

# 8. INSTALL PAGE UI

Tampilan harus sederhana dan profesional.

Jangan gunakan:

- gradient
- glassmorphism
- emoji
- AI illustration
- neon
- excessive animation
- futuristic UI
- dekorasi berlebihan

Gunakan:

- background solid
- typography jelas
- button besar
- spacing yang baik
- layout responsive

Contoh:

```text
SELF PHOTO BOOTH
POSE ASSISTANT

Install aplikasi pada tablet ini.

[ INSTALL APP ]

Setelah aplikasi terpasang,
buka aplikasi untuk masuk ke mode booth.
```

---

# 9. INSTALLATION STATES

Halaman `/install` harus mampu menangani beberapa kondisi.

### Ready

```text
Ready to install
[ Install App ]
```

### Installing

```text
Installing...
```

### Already Installed

```text
Application already installed.

[ Open Booth ]
```

### Browser Tidak Mendukung Install Prompt

Tampilkan instruksi manual:

```text
Buka menu browser
Pilih Install App / Add to Home Screen
Konfirmasi instalasi
```

---

# 10. PWA START URL

Setelah PWA terinstall dan dibuka dari Home Screen, aplikasi harus membuka:

```text
/booth
```

Bukan `/install`.

---

# 11. BOOTH MODE

Halaman:

```text
/booth
```

adalah interface utama yang digunakan customer.

Tidak menampilkan:

- admin menu
- dashboard
- database controls
- upload controls
- debugging information

Interface harus fokus pada pose recommendation.

---

# 12. PEOPLE DETECTION

Gunakan computer vision yang sesuai dengan aturan `@CLAUDE.md`.

Jika tidak ditentukan di `@CLAUDE.md`, gunakan:

```text
MediaPipe Tasks Vision
```

untuk mendeteksi jumlah orang.

Sistem harus menghasilkan:

```text
0 people
1 person
2 people
3 people
4 people
5 people
...
```

Jumlah orang tidak boleh di-hardcode hanya sampai 4 atau 5.

Sistem harus memungkinkan penambahan jumlah orang melalui database.

---

# 13. STABLE DETECTION

Jangan langsung mengubah jumlah orang berdasarkan satu frame.

Gunakan temporal smoothing / debounce.

Contoh:

```text
4
4
3
4
4
4
```

hasil:

```text
4 people
```

Tujuannya agar rekomendasi tidak terus berubah ketika detection mengalami sedikit fluktuasi.

---

# 14. DETECTION STATE

Gunakan state yang jelas, misalnya:

```text
IDLE
INITIALIZING
DETECTING
STABLE
LOADING_RECOMMENDATIONS
SHOWING_POSE
ERROR
```

Implementasi harus modular.

---

# 15. RECOMMENDATION SYSTEM

Core logic:

```text
Detect People
      ↓
Stable People Count
      ↓
Find Active Poses
      ↓
Filter By People Count
      ↓
Randomize
      ↓
Remove Duplicate
      ↓
Take Recommendation Count
      ↓
Display
```

Contoh:

Jika terdeteksi:

```text
4 people
```

maka sistem mencari:

```text
poses.people_count = 4
AND poses.active = true
```

Kemudian menampilkan 10 rekomendasi.

---

# 16. RECOMMENDATION COUNT

Default:

```text
10 poses
```

Tetapi jumlah tersebut harus berasal dari configuration/database.

Admin dapat mengubah:

```text
10
15
20
```

tanpa mengubah source code.

---

# 17. NO DUPLICATE

Dalam satu session, pose yang sama tidak boleh ditampilkan dua kali.

Jika hanya tersedia 6 pose untuk 4 orang:

```text
6 available
```

maka tampilkan 6.

Jangan menduplikasi pose hanya untuk mencapai 10.

---

# 18. POSE DATA

Foto pose tidak boleh hardcode di JavaScript.

Semua pose berasal dari database.

Admin mengupload foto melalui dashboard.

Setiap pose minimal memiliki:

```text
name
people_count
category
image
instruction
active
sort_order
```

Tambahkan field lain jika memang diperlukan berdasarkan arsitektur `@CLAUDE.md`.

---

# 19. POSE CATEGORY

Buat sistem kategori yang fleksibel.

Contoh:

```text
Casual
Funny
Friendship
Formal
Creative
Dynamic
Aesthetic
Group
```

Admin dapat menambah kategori baru tanpa mengubah source code.

---

# 20. PEOPLE COUNT MANAGEMENT

Jumlah orang juga harus dapat dikelola dari dashboard.

Contoh:

```text
1 person
2 people
3 people
4 people
5 people
6 people
```

Admin dapat menambahkan:

```text
7
8
9
10
```

jika diperlukan.

---

# 21. POSE UPLOAD

Admin harus dapat upload foto secara manual melalui dashboard.

WAJIB mendukung:

```text
Drag & Drop
Multiple File Upload
```

Contoh:

```text
20 foto
```

dapat di-upload sekaligus.

---

# 22. BULK UPLOAD FLOW

Contoh:

```text
Admin
 ↓
Pose Management
 ↓
Upload
 ↓
Drag & Drop 20 images
 ↓
Select People Count = 4
 ↓
Select Category
 ↓
Upload
 ↓
20 pose records
```

Jika memungkinkan secara arsitektur, metadata seperti category dan people count dapat diterapkan ke seluruh batch.

---

# 23. IMAGE PROCESSING

Saat upload:

```text
Validate
 ↓
Optimize
 ↓
Generate appropriate web format
 ↓
Generate thumbnail
 ↓
Store
 ↓
Create database record
```

Gunakan image optimization yang sesuai dengan stack pada `@CLAUDE.md`.

Jangan membuat tablet mengunduh file original yang terlalu besar jika tidak diperlukan.

---

# 24. POSE MANAGEMENT

Dashboard harus menyediakan:

```text
Create
View
Edit
Delete
Activate
Deactivate
Search
Filter
Bulk Actions
```

Admin dapat melihat:

```text
Thumbnail
Pose Name
People Count
Category
Status
Created At
```

---

# 25. ACTIVE / INACTIVE

Pose memiliki status:

```text
active
```

Jika inactive:

```text
Tidak boleh muncul pada recommendation engine.
```

Namun data tetap tersimpan di dashboard.

---

# 26. NAVIGATION SYSTEM

Customer dapat berpindah pose menggunakan tiga metode:

```text
1. Hand Gesture
2. Voice Command
3. Manual Button
```

Ketiga metode harus menggunakan navigation controller yang sama.

---

# 27. CENTRAL NAVIGATION

Gunakan architecture:

```text
Hand Gesture
       ↓
Voice Command → Navigation Controller
       ↑
Manual Button
       ↓
NEXT_POSE / PREVIOUS_POSE
```

Jangan membuat masing-masing metode mengubah UI secara langsung.

Semua harus memanggil satu central navigation system.

---

# 28. NAVIGATION ACTION

Minimal:

```text
NEXT_POSE
PREVIOUS_POSE
```

Contoh:

```text
Hand Swipe
→ NEXT_POSE
```

```text
Voice "next"
→ NEXT_POSE
```

```text
Button Next
→ NEXT_POSE
```

---

# 29. HAND GESTURE

Jika `@CLAUDE.md` tidak menentukan library lain, gunakan MediaPipe Hand Landmarker.

Gesture minimal:

```text
Swipe Left
Swipe Right
```

Mapping dapat dibuat:

```text
Swipe Left
→ Next
```

```text
Swipe Right
→ Previous
```

Gunakan:

```text
gesture threshold
gesture confidence
gesture cooldown
```

agar satu gesture tidak memicu banyak perpindahan.

---

# 30. VOICE COMMAND

Gunakan teknologi browser yang kompatibel dengan aturan `@CLAUDE.md`.

Jika tidak ditentukan, gunakan Web Speech API.

Command minimal:

```text
next
previous
```

Optional:

```text
next pose
previous pose
```

Voice command hanya digunakan sebagai trigger.

Jangan menyimpan audio customer.

---

# 31. VOICE LANGUAGE

Minimal dukung:

```text
en-US
id-ID
```

Language harus dapat diubah melalui dashboard.

---

# 32. VOICE ENABLE/DISABLE

Dashboard harus memiliki:

```text
Voice Command
ON / OFF
```

Jika OFF:

```text
Voice recognition tidak dijalankan.
```

---

# 33. HAND GESTURE ENABLE/DISABLE

Dashboard:

```text
Hand Gesture
ON / OFF
```

Jika OFF:

```text
Hand detection tidak dijalankan.
```

---

# 34. MANUAL NAVIGATION

Dashboard:

```text
Manual Navigation
ON / OFF
```

Jika ON:

```text
Previous
Next
```

ditampilkan pada tablet.

Jika OFF:

tombol manual disembunyikan.

Namun untuk MVP, disarankan **Manual Navigation default ON** sebagai fallback.

---

# 35. FALLBACK

Jika voice gagal:

```text
Hand Gesture
+
Manual Button
```

tetap bekerja.

Jika hand gesture gagal:

```text
Voice
+
Manual Button
```

tetap bekerja.

Jika voice dan gesture gagal:

```text
Manual Button
```

tetap bekerja.

Sistem tidak boleh bergantung hanya pada satu metode input.

---

# 36. BOOTH UI

Gunakan desain:

```text
Minimal
Professional
Clean
Neutral
High Readability
Touch Friendly
```

Jangan menggunakan:

```text
gradient
emoji
AI generated visual
glassmorphism
neon
excessive shadow
```

---

# 37. TABLET LAYOUT

Target utama:

```text
Landscape
100vw
100vh
```

Tidak boleh terdapat scrolling pada halaman booth kecuali benar-benar diperlukan.

---

# 38. POSE DISPLAY

Tampilkan:

```text
Pose Image
Pose Name
Instruction
Current Position
Total Recommendations
```

Contoh:

```text
Side By Side

Stand next to each other
and lean slightly toward the center.

3 / 10
```

---

# 39. NAVIGATION UI

Jika manual navigation aktif:

```text
[ Previous ]       [ Next ]
```

Button harus cukup besar untuk disentuh dengan mudah.

---

# 40. CURRENT POSE

Contoh:

```text
3 / 10
```

Jika Next:

```text
4 / 10
```

Jika Previous:

```text
2 / 10
```

Ketika mencapai pose terakhir:

```text
10 / 10
```

Next dapat:

```text
kembali ke pose pertama
```

atau menggunakan behavior yang dapat dikonfigurasi.

Untuk MVP, gunakan looping:

```text
10 → 1
1 → 10
```

---

# 41. SESSION

Setiap perubahan jumlah orang yang stabil membuat recommendation session baru.

Contoh:

```text
4 people
→ Session A
→ 10 poses
```

Jika berubah menjadi:

```text
3 people
→ Session B
→ 10 poses
```

---

# 42. GROUP COUNT CHANGE

Jika jumlah orang berubah secara stabil:

```text
4 people
```

menjadi:

```text
3 people
```

maka:

```text
Clear current recommendations
 ↓
Generate 3-person recommendations
 ↓
Show first pose
```

---

# 43. SETTINGS DASHBOARD

Dashboard minimal memiliki pengaturan:

```text
Recommendation Count
Hand Gesture Enabled
Voice Enabled
Manual Navigation Enabled
Voice Language
Voice Confidence
Gesture Confidence
Gesture Cooldown
Detection Confidence
Detection Smoothing
```

Gunakan struktur settings yang modular.

Jangan hardcode configuration pada JavaScript.

---

# 44. CONTENT SYNC

Pose yang diupload dari dashboard harus dapat digunakan tablet tanpa reinstall aplikasi.

Flow:

```text
Admin Upload Pose
        ↓
Database
        ↓
API
        ↓
Tablet Sync
        ↓
Local Cache
        ↓
Pose Available
```

---

# 45. APPLICATION UPDATE VS CONTENT UPDATE

Pisahkan:

```text
Application Update
```

dan:

```text
Content Update
```

Jika admin hanya:

```text
Upload pose
Edit pose
Delete pose
Change setting
```

maka:

```text
TIDAK PERLU REINSTALL PWA
```

Tablet cukup melakukan content synchronization.

---

# 46. PWA UPDATE

Jika source code aplikasi berubah:

```text
New application version
```

service worker harus mendeteksi update.

Tampilkan:

```text
A new version is available.

[ Update Now ]
```

Jangan memaksa reload ketika customer sedang berada di tengah session.

---

# 47. OFFLINE MODE

Setelah pertama kali melakukan synchronization, aplikasi harus dapat menjalankan core functionality ketika internet terputus.

Minimal:

```text
Cached Pose Images
Cached Pose Metadata
Cached Settings
Person Detection
Hand Gesture
Manual Navigation
Pose Display
```

tetap bekerja.

---

# 48. LOCAL STORAGE

Jika data pose cukup besar, gunakan IndexedDB daripada menyimpan seluruh data menggunakan localStorage.

Gunakan local storage hanya untuk data kecil jika diperlukan.

---

# 49. DEVICE MANAGEMENT

Walaupun MVP hanya digunakan pada satu tablet, architecture harus siap untuk lebih dari satu device.

Siapkan konsep:

```text
Device
Booth
Device Token
Last Seen
App Version
Content Version
```

Namun jangan membuat sistem terlalu kompleks jika belum diperlukan untuk MVP.

---

# 50. DEVICE REGISTRATION

Tablet harus dapat dikenali oleh server.

Contoh:

```text
Booth Tablet 01
```

Server dapat mengetahui:

```text
Last Seen
App Version
Content Version
Active
```

---

# 51. DASHBOARD DEVICE

Admin dapat melihat:

```text
Device Name
Booth
Status
Last Seen
App Version
Content Version
```

Status:

```text
Online
Offline
```

---

# 52. HEARTBEAT

Tablet dapat mengirim heartbeat berkala untuk menunjukkan device masih aktif.

Jangan menggunakan interval yang terlalu agresif.

Gunakan interval yang reasonable untuk shared hosting.

---

# 53. API

Gunakan API hanya jika diperlukan untuk komunikasi antara:

```text
Laravel
↕
PWA Booth
```

Minimal dapat memiliki:

```text
GET configuration
GET poses
GET content version
Device registration
Device heartbeat
```

Struktur endpoint harus mengikuti conventions pada `@CLAUDE.md`.

---

# 54. SECURITY

Pastikan:

```text
Authentication
Authorization
CSRF
Validation
Rate Limiting
Secure Upload
File Validation
Device Authentication
HTTPS
```

diterapkan sesuai arsitektur `@CLAUDE.md`.

Jangan expose:

```text
Admin credentials
API secrets
Private configuration
```

kepada browser.

---

# 55. PRIVACY

Karena sistem digunakan di self photo booth:

WAJIB memastikan:

```text
No photo storage
No photo upload
No video recording
No camera frame upload
No audio recording storage
```

Camera processing sebisa mungkin dilakukan secara lokal pada browser/device.

---

# 56. SHARED HOSTING

Project harus dapat dideploy ke shared hosting yang mendukung Laravel.

Jangan menjadikan dependency berikut sebagai requirement wajib:

```text
Docker
Python backend
Node server production
Redis server
WebSocket server
```

Jika `@CLAUDE.md` menentukan requirement tertentu, ikuti `@CLAUDE.md`.

Vite/build tools hanya digunakan untuk proses build jika sesuai dengan project.

Production harus menggunakan compiled assets.

---

# 57. DATABASE DESIGN

Buat database yang modular.

Minimal membutuhkan konsep:

```text
users
poses
categories
people_counts
settings
booths
devices
```

Gunakan migration, model, relationship, validation, dan conventions sesuai `@CLAUDE.md`.

Jangan membuat database schema yang terlalu kompleks untuk MVP.

---

# 58. DASHBOARD

Dashboard `/admin` harus dibuat menggunakan teknologi dan pola yang ditentukan oleh:

```text
@CLAUDE.md
```

Jangan menggunakan Filament kecuali `@CLAUDE.md` memang secara eksplisit menggunakannya.

Dashboard harus menyediakan:

```text
Dashboard
Pose Management
Category Management
People Count Management
Settings
Device Management
```

---

# 59. DASHBOARD PRINCIPLE

Dashboard harus digunakan untuk mengubah data dan konfigurasi tanpa harus mengubah source code.

Contoh:

Admin ingin:

```text
Recommendation Count:
10 → 20
```

Tidak boleh membutuhkan developer.

Admin ingin:

```text
Voice:
ON → OFF
```

Tidak boleh membutuhkan developer.

Admin ingin:

```text
Tambah kategori:
Group Funny
```

Tidak boleh membutuhkan developer.

Admin ingin:

```text
Tambah 20 pose untuk 4 orang
```

Tidak boleh membutuhkan developer.

---

# 60. MODULAR ARCHITECTURE

Pisahkan logic menjadi beberapa module/service sesuai conventions `@CLAUDE.md`.

Conceptually:

```text
Person Detection
Hand Gesture
Voice Command
Recommendation Engine
Pose Navigation
PWA
Content Sync
Device Management
```

Jangan menempatkan seluruh logic pada satu file.

---

# 61. RECOMMENDATION ENGINE

Recommendation engine harus berdiri sendiri.

Input:

```text
peopleCount
```

Output:

```text
Pose[]
```

Contoh:

```text
getRecommendations(4)
```

menghasilkan:

```text
[
    pose1,
    pose2,
    pose3,
    ...
]
```

Dengan architecture ini nantinya mudah ditambahkan:

```text
Category preference
Difficulty
Popularity
AI recommendation
Pose similarity
```

---

# 62. FUTURE DEVELOPMENT

Architecture harus memungkinkan pengembangan berikut.

### Phase berikutnya:

```text
Multi Booth
Multi Device
Remote Device Management
Analytics
Popular Pose
Pose Usage Statistics
```

### Future AI:

```text
Body Landmark Analysis
Pose Similarity
AI Pose Recommendation
Automatic Pose Ranking
```

### Future Input:

```text
Bluetooth Remote
Physical Button
Foot Pedal
External Controller
```

Jangan implementasikan fitur future tersebut sekarang kecuali diperlukan.

---

# 63. PERFORMANCE

Tablet Android mungkin memiliki hardware terbatas.

Prioritaskan:

```text
Low CPU Usage
Low Memory Usage
Fast Loading
Optimized Images
Efficient Detection
Efficient Gesture Detection
Minimal Network Requests
```

Jangan menjalankan computer vision dengan frame rate yang tidak diperlukan.

---

# 64. CAMERA PERFORMANCE

Person detection dan hand gesture detection harus dioptimalkan.

Jangan menjalankan semua model dengan beban maksimal secara terus-menerus jika tidak diperlukan.

Gunakan:

```text
Detection interval
Confidence threshold
Temporal smoothing
```

sesuai kebutuhan.

---

# 65. ERROR HANDLING

Jika camera permission ditolak:

```text
Camera permission is required
to detect the number of people.
```

Jika model gagal dimuat:

```text
Person detection is unavailable.
```

Jika tidak ada pose:

```text
No poses are available
for this group size.
```

Jika offline:

```text
Offline mode
Using cached content.
```

Jika voice tidak tersedia:

```text
Voice command is unavailable.
Use the manual button.
```

Jangan membuat aplikasi crash.

---

# 66. EMPTY STATE

Jika terdeteksi:

```text
0 people
```

jangan menampilkan pose.

Tampilkan:

```text
Waiting for people...
```

---

# 67. LOADING STATE

Saat sistem sedang memuat pose:

```text
Loading poses...
```

Jangan menampilkan halaman kosong.

---

# 68. ADMIN UPLOAD EXPERIENCE

Upload harus memberikan feedback:

```text
Uploading...
Processing...
Completed
Failed
```

Jika beberapa file gagal:

```text
18 uploaded successfully
2 failed
```

Admin harus mengetahui file mana yang gagal.

---

# 69. VALIDATION

Image upload harus memvalidasi:

```text
File type
File size
Image dimensions
```

Jangan menerima file berbahaya.

---

# 70. UI ADMIN

Dashboard admin tidak perlu terlihat seperti aplikasi AI.

Gunakan:

```text
Clean
Professional
Functional
Dense but readable
```

Tidak perlu:

```text
Gradient
Glassmorphism
3D illustration
AI icons
Excessive animation
```

---

# 71. UI BOOTH

Booth UI harus lebih sederhana daripada admin.

Customer tidak perlu mengetahui:

```text
MediaPipe
API
PWA
Device
Detection confidence
```

Tampilkan hanya informasi yang relevan untuk mereka.

---

# 72. ACCESSIBILITY

Button harus memiliki ukuran yang nyaman untuk touchscreen.

Text harus mudah dibaca dari jarak beberapa meter.

Contrast harus baik.

Jangan menggunakan text terlalu kecil.

---

# 73. TESTING

Buat testing untuk:

### Detection

```text
0
1
2
3
4
5
```

### Recommendation

```text
1 person → correct poses
2 people → correct poses
3 people → correct poses
4 people → correct poses
5 people → correct poses
```

### Navigation

```text
Next
Previous
Gesture
Voice
```

### Settings

```text
Voice ON
Voice OFF
Gesture ON
Gesture OFF
Manual ON
Manual OFF
```

### PWA

```text
Install
Open
Offline
Update
```

### Upload

```text
Single upload
Multiple upload
Invalid file
Duplicate file
Large file
```

---

# 74. ACCEPTANCE CRITERIA

Project dianggap berhasil jika:

## Admin

Admin dapat:

- login
- membuka dashboard
- upload banyak pose
- drag & drop
- menentukan jumlah orang
- menentukan kategori
- mengedit pose
- menghapus pose
- activate/deactivate pose
- mengatur recommendation count
- mengaktifkan/nonaktifkan voice
- mengaktifkan/nonaktifkan hand gesture
- mengaktifkan/nonaktifkan manual navigation
- mengubah voice language
- mengubah detection settings

## Install

Operator:

```text
Buka /install
→ Install PWA
→ Open Booth
```

## Booth

Tablet:

```text
Detect people
→ Determine people count
→ Load matching poses
→ Show recommendations
→ Next via gesture
→ Next via voice
→ Next via button
```

## Content Update

Admin:

```text
Upload new pose
```

Tablet:

```text
Sync
→ Pose tersedia
```

Tanpa reinstall PWA.

## Offline

Setelah data tersinkronisasi:

```text
Internet OFF
```

Core booth functionality tetap berjalan.

---

# 75. DEVELOPMENT METHOD

Jangan langsung membuat seluruh project dalam satu langkah.

Kerjakan secara bertahap.

## STEP 1

Analisis terlebih dahulu:

```text
@CLAUDE.md
```

Kemudian jelaskan:

- teknologi yang tersedia
- struktur project
- conventions
- dependency
- arsitektur yang harus diikuti
- bagian yang perlu ditambahkan

Jangan mengubah kode sebelum analisis selesai.

---

## STEP 2

Buat foundation:

```text
Laravel
Database
Authentication
Admin foundation
PWA foundation
```

---

## STEP 3

Buat database:

```text
poses
categories
people_counts
settings
booths
devices
```

Sesuai conventions `@CLAUDE.md`.

---

## STEP 4

Buat dashboard:

```text
Pose Management
Category Management
People Count
Settings
Devices
```

---

## STEP 5

Buat bulk image upload.

---

## STEP 6

Buat `/install`.

---

## STEP 7

Buat `/booth`.

---

## STEP 8

Implementasikan person detection.

---

## STEP 9

Implementasikan recommendation engine.

---

## STEP 10

Implementasikan manual navigation.

---

## STEP 11

Implementasikan hand gesture.

---

## STEP 12

Implementasikan voice command.

---

## STEP 13

Implementasikan offline cache dan synchronization.

---

## STEP 14

Implementasikan device registration.

---

## STEP 15

Implementasikan PWA update.

---

# 76. CARA MEMBERIKAN OUTPUT CODE

Untuk setiap tahap:

1. Jelaskan apa yang akan dibuat.
2. Sebutkan file yang akan dibuat/diubah.
3. Berikan command yang harus dijalankan.
4. Berikan kode lengkap untuk file yang diperlukan.
5. Jelaskan fungsi kode.
6. Jelaskan cara menjalankan.
7. Jelaskan cara testing.
8. Jelaskan expected result.
9. Jika ada error, berikan troubleshooting.

Jangan memberikan pseudo-code jika kode production dapat diberikan.

Jangan membuat file yang tidak diperlukan.

---

# 77. CODE QUALITY

Ikuti seluruh coding standards dari:

```text
@CLAUDE.md
```

Prioritaskan:

```text
Readable
Maintainable
Modular
Testable
Secure
Performant
```

Jangan melakukan over-engineering.

---

# 78. IMPORTANT

Jangan:

- menggunakan Filament secara otomatis
- menggunakan React secara otomatis
- menggunakan Vue secara otomatis
- menggunakan Node server sebagai backend
- membuat sistem microservices
- membuat Docker requirement
- membuat WebSocket requirement
- membuat AI recommendation pada MVP
- membuat sistem multi-tenant kompleks
- membuat koneksi ke kamera utama
- membuat photo capture
- menyimpan foto customer

kecuali `@CLAUDE.md` atau instruksi saya secara eksplisit memerlukannya.

---

# 79. MVP PRIORITY

Prioritas utama:

```text
1. Working
2. Simple
3. Stable
4. Modular
5. Maintainable
6. Fast
7. PWA compatible
8. Shared-hosting compatible
```

Jangan mengejar kompleksitas.

Sistem ini pertama kali akan digunakan pada:

```text
1 Booth
1 Tablet
```

Setelah MVP stabil, baru dikembangkan menjadi sistem multi-device.

---

# 80. FINAL SYSTEM FLOW

Gunakan alur berikut sebagai acuan utama:

```text
                    ADMIN
                      |
                      v
                /admin
                      |
        +-------------+-------------+
        |             |             |
      Poses        Settings      Devices
        |             |             |
        +-------------+-------------+
                      |
                      v
                   Laravel
                      |
                      v
                     API
                      |
                      v
                Tablet Android
                      |
                      v
                   /install
                      |
                 Install PWA
                      |
                      v
                   /booth
                      |
                      v
              Camera Permission
                      |
                      v
              Person Detection
                      |
                      v
               Stable Count
                      |
                      v
              Recommendation
                      |
                      v
                Pose Display
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Gesture      Voice       Button
          |           |           |
          +-----------+-----------+
                      |
                      v
               Next / Previous
```

---

# 81. CORE BUSINESS RULE

Business rule paling penting:

```text
JUMLAH ORANG
      ↓
REKOMENDASI POSE
```

Contoh:

```text
1 orang
→ pose untuk 1 orang

2 orang
→ pose untuk 2 orang

3 orang
→ pose untuk 3 orang

4 orang
→ pose untuk 4 orang

5 orang
→ pose untuk 5 orang
```

Data pose dikelola oleh admin.

Tidak ada hardcoded pose pada frontend.

---

# 82. FINAL INSTRUCTION TO CLAUDE

Sebelum melakukan implementasi:

**BACA `@CLAUDE.md` TERLEBIH DAHULU.**

Gunakan `@CLAUDE.md` sebagai source of truth.

Kemudian:

1. Analisis project yang sudah ada.
2. Jangan merusak fitur yang sudah tersedia.
3. Identifikasi teknologi yang sudah digunakan.
4. Identifikasi struktur folder.
5. Identifikasi database yang sudah tersedia.
6. Identifikasi authentication yang sudah tersedia.
7. Identifikasi coding conventions.
8. Identifikasi dependency yang sudah tersedia.
9. Gunakan kembali komponen/utilitas yang sudah ada jika relevan.
10. Hindari membuat ulang sesuatu yang sudah tersedia.
11. Jangan menambahkan dependency tanpa alasan.
12. Implementasikan project secara bertahap.
13. Pastikan setiap tahap dapat dijalankan dan dites sebelum lanjut.
14. Jangan menganggap Filament digunakan.
15. Jangan menganggap React/Vue digunakan.
16. Jangan membuat arsitektur yang bertentangan dengan `@CLAUDE.md`.

**Mulai dengan ANALISIS PROJECT terlebih dahulu. Jangan langsung melakukan implementasi.**