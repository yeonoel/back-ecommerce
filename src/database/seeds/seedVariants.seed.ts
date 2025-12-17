import { DataSource } from 'typeorm';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';
import { Product } from '../../products/entities/product.entity';

export async function seedVariants(ds: DataSource) {
  const variantRepo = ds.getRepository(ProductVariant);
  const productRepo = ds.getRepository(Product);

  const products = await productRepo.find();
  
  if (products.length === 0) {
    throw new Error('Products not found. Run product seed first.');
  }

  const variants = [
    {
      product: products[0],
      name: 'Blanc - M',
      sku: 'TS-BL-M',
      stockQuantity: 30,
    },
    {
      product: products[0],
      name: 'Blanc - L',
      sku: 'TS-BL-L',
      stockQuantity: 20,
    },
  ];

  for (const variantData of variants) {
    const existing = await variantRepo.findOne({ 
      where: { sku: variantData.sku } 
    });
    
    if (!existing) {
      await variantRepo.save(variantData);
      console.log(`✅ Variant "${variantData.name}" created`);
    } else {
      await variantRepo.update(existing.id, variantData);
      console.log(`ℹ️  Variant "${variantData.name}" updated`);
    }
  }

  return variantRepo.find();
}