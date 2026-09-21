# Vendor OffPay + visibility fix

Backend (deploy first): controllers/adminController.js, controllers/vendorController.js, models/foodModel.js
Frontend: src/pages/Register.jsx, src/pages/vendor/VendorDashboard.jsx, src/pages/admin/AdminDashboard.jsx

## Fix the vendor you already created (one-off)
Admin > Vendors > set the vendor to Tier 1 (with the new backend this also publishes their drafts).
Or in SQL (replace the id):
  UPDATE vendors SET tier = 1, payment_verified_at = NOW() WHERE id = '<vendor-id>';
  UPDATE foods   SET is_available = TRUE WHERE vendor_id = '<vendor-id>';
