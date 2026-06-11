-- Drop old combination table
DROP TABLE IF EXISTS "template_combinations" CASCADE;

-- Create separate color/size/material tables
CREATE TABLE "template_colors" (
    "id" SERIAL NOT NULL,
    "jersey_template_id" INTEGER NOT NULL,
    "variant_option_id" INTEGER NOT NULL,

    CONSTRAINT "template_colors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "template_sizes" (
    "id" SERIAL NOT NULL,
    "jersey_template_id" INTEGER NOT NULL,
    "variant_option_id" INTEGER NOT NULL,

    CONSTRAINT "template_sizes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "template_materials" (
    "id" SERIAL NOT NULL,
    "jersey_template_id" INTEGER NOT NULL,
    "variant_option_id" INTEGER NOT NULL,

    CONSTRAINT "template_materials_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "template_colors_jersey_template_id_variant_option_id_key" ON "template_colors"("jersey_template_id", "variant_option_id");
CREATE UNIQUE INDEX "template_sizes_jersey_template_id_variant_option_id_key" ON "template_sizes"("jersey_template_id", "variant_option_id");
CREATE UNIQUE INDEX "template_materials_jersey_template_id_variant_option_id_key" ON "template_materials"("jersey_template_id", "variant_option_id");

-- Foreign keys
ALTER TABLE "template_colors" ADD CONSTRAINT "template_colors_jersey_template_id_fkey" FOREIGN KEY ("jersey_template_id") REFERENCES "jersey_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "template_colors" ADD CONSTRAINT "template_colors_variant_option_id_fkey" FOREIGN KEY ("variant_option_id") REFERENCES "variant_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "template_sizes" ADD CONSTRAINT "template_sizes_jersey_template_id_fkey" FOREIGN KEY ("jersey_template_id") REFERENCES "jersey_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "template_sizes" ADD CONSTRAINT "template_sizes_variant_option_id_fkey" FOREIGN KEY ("variant_option_id") REFERENCES "variant_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "template_materials" ADD CONSTRAINT "template_materials_jersey_template_id_fkey" FOREIGN KEY ("jersey_template_id") REFERENCES "jersey_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "template_materials" ADD CONSTRAINT "template_materials_variant_option_id_fkey" FOREIGN KEY ("variant_option_id") REFERENCES "variant_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
