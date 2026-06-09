# Custom Jersey

## Overview

Custom Jersey adalah fitur untuk memesan jersey kustom dengan template yang telah ditentukan admin. User memilih template, warna, bahan, lalu mengisi data tim dan pemain. Hasil akhir tetap tersimpan sebagai `CustomOrder` biasa.

## Arsitektur

```
[Jersey UI]
  pilih template → warna + bahan
  input nama tim, logo, daftar pemain + nomor + ukuran
       ↓
[Translator Service] (CustomJerseyService)
  buat CustomOrder (images = gambar template)
  buat CustomOrderItem (quantity manual dari user)
  buat CustomOrderItemOption (color + material)
  buat TimJersey + Pemain[]
       ↓
[CustomOrder] ← sama persis kaya custom order biasa
```

## Model Baru

### JerseyTemplate

Template jersey yang dibuat admin.

| Column | Type | Description |
|---|---|---|
| id | Int | Primary key |
| name | String | Nama template |
| image | String? | Path gambar template |
| description | String? | Deskripsi |
| status | Boolean | Active/inactive |
| created_at | DateTime | |
| updated_at | DateTime | |

### TemplateCombination

Kombinasi warna + ukuran + bahan yang valid untuk suatu template. Refer ke `VariantOption`.

| Column | Type | Description |
|---|---|---|
| id | Int | Primary key |
| jersey_template_id | Int | FK ke JerseyTemplate |
| color_option_id | Int | FK ke VariantOption (warna) |
| size_option_id | Int | FK ke VariantOption (ukuran) |
| material_option_id | Int | FK ke VariantOption (bahan) |

**Unique constraint:** `(jersey_template_id, color_option_id, size_option_id, material_option_id)`

### TimJersey

Informasi tim untuk pesanan jersey. Relasi 1:1 ke `CustomOrder`.

| Column | Type | Description |
|---|---|---|
| id | Int | Primary key |
| custom_order_id | Int | FK ke CustomOrder (unique) |
| team_name | String? | Nama tim (input user) |
| logo | String? | Path logo (upload user) |
| created_at | DateTime | |
| updated_at | DateTime | |

### Pemain

Daftar pemain dalam suatu tim. Relasi ke `TimJersey`.

| Column | Type | Description |
|---|---|---|
| id | Int | Primary key |
| tim_jersey_id | Int | FK ke TimJersey |
| name | String | Nama pemain (input user) |
| nomor_punggung | Int | Nomor punggung (input user) |
| ukuran_option_id | Int | FK ke VariantOption (ukuran per pemain) |
| created_at | DateTime | |

## RBAC

### Page: `JerseyTemplates` (ID: 42)

| Role | Akses |
|---|---|
| superadmin | CRUD |
| admin | CRUD |
| staff | Read only |
| customer | Tidak via RBAC (GET tanpa `@Access`) |
| finance | Tidak ada akses |

### Endpoints

#### JerseyTemplates (CRUD Admin)

```http
GET    /jersey-templates?include_inactive=false   # Semua login bisa lihat
GET    /jersey-templates/:id                      # Semua login bisa lihat
POST   /jersey-templates                          # @Access('JerseyTemplates', 'create')
PATCH  /jersey-templates/:id                      # @Access('JerseyTemplates', 'update')
DELETE /jersey-templates/:id                      # @Access('JerseyTemplates', 'delete')
```

#### Custom Jersey Order

```http
POST /custom-jersey/order   # @Access('CustomOrders', 'create')
```

Content-Type: `multipart/form-data`

| Field | Type | Required | Description |
|---|---|---|---|
| name | string | ✅ | Nama pemesan |
| phone | string | ✅ | No telepon |
| email | string | ✅ | Email |
| deadline | Date | ✅ | Deadline ISO string |
| catatan_tambahan | string | | Catatan |
| jersey_template_id | number | ✅ | ID template yang dipilih |
| color_option_id | number | ✅ | ID VariantOption warna |
| material_option_id | number | ✅ | ID VariantOption bahan |
| quantity | number | ✅ | Jumlah jersey (manual) |
| team_name | string | | Nama tim |
| name_item | string | | Nama item (default: "Produk") |
| pemain | string(JSON) | | Array `[{name, nomor_punggung, ukuran_option_id}]` |
| logo | file | | Upload logo tim (JPEG/PNG/GIF/WEBP) |
| dp_amount | number | | (Admin only) |
| remaining_amount | number | | (Admin only) |
| total_amount | number | | (Admin only) |

Contoh body (multipart):

```
name: Budi
phone: 08123456789
email: budi@mail.com
deadline: 2026-07-01
jersey_template_id: 1
color_option_id: 5
material_option_id: 10
quantity: 20
team_name: Garuda FC
name_item: Jersey Garuda
pemain: [{"name":"Budi","nomor_punggung":10,"ukuran_option_id":3},{"name":"Dodi","nomor_punggung":7,"ukuran_option_id":4}]
```

## Validasi

### Template Combination

Saat submit, system cek apakah kombinasi `(color_option_id, material_option_id)` valid untuk template yang dipilih. Jika kombinasi tidak ditemukan di `TemplateCombination`, throw error.

### Deadline

Tidak boleh di masa lalu.

### Financial Fields

Hanya admin/superadmin yang bisa mengisi `dp_amount`, `remaining_amount`, `total_amount`.

## Notes

- Tidak ada field baru di `CustomOrder` / `CustomOrderItem` — semua pakai existing structure
- `CustomOrderItem.quantity` diisi manual oleh user (bukan otomatis dari jumlah pemain)
- `CustomOrder.images` diisi auto-assign dari `JerseyTemplate.image`
- Export PDF/Excel oleh staff (logo+nama tim → PDF, pemain → Excel) bersifat opsional, data tetap aman di DB
