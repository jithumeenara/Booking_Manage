/* 
  Run this SQL command in your live database (e.g., via phpMyAdmin, Workbench, or CLI) 
  to add the new columns for split bill amounts.
*/

ALTER TABLE bookings 
ADD COLUMN bill_base_amount DECIMAL(10,2) DEFAULT 0,
ADD COLUMN bill_gst_amount DECIMAL(10,2) DEFAULT 0;
