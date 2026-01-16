
ALTER TABLE training_halls 
ADD COLUMN hall_sub_name VARCHAR(255),
ADD COLUMN hall_rent_per_day DECIMAL(10,2) DEFAULT 0;
