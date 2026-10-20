import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/category'
import Product from '#models/product'

export default class extends BaseSeeder {
  async run() {
    const categoriesData = [
      {
        name: 'Entradas',
        slug: 'entradas',
        emoji: '🥗',
        sortOrder: 1,
        isActive: true,
        products: [
          {
            name: 'Bruschetta ao Azeite',
            description:
              'Pão artesanal grelhado com tomate concassé, manjericão fresco e azeite extravirgem siciliano.',
            price: 32,
            imageUrl:
              'https://images.unsplash.com/photo-1594978583693-8dfdfc93f052?w=600&h=400&fit=crop&auto=format',
            tags: ['Vegano'],
            isAvailable: true,
          },
          {
            name: 'Tartare de Atum',
            description:
              'Atum bluefin marinado em shoyu cítrico, caviar de limão e crocante de arroz negro.',
            price: 68,
            imageUrl:
              'https://images.unsplash.com/photo-1660230687259-ab2821e7480c?w=600&h=400&fit=crop&auto=format',
            tags: ['Sem Glúten'],
            isAvailable: true,
          },
          {
            name: 'Ostras Frescas',
            description:
              'Seis ostras da costa catarinense com granita de pepino e mignonette de champagne.',
            price: 89,
            imageUrl:
              'https://images.unsplash.com/photo-1779918262062-76030c8cbbff?w=600&h=400&fit=crop&auto=format',
            tags: ['Sem Glúten', 'Mar'],
            isAvailable: true,
          },
        ],
      },
      {
        name: 'Principais',
        slug: 'principais',
        emoji: '🍽',
        sortOrder: 2,
        isActive: true,
        products: [
          {
            name: 'Filé ao Molho Trufado',
            description:
              'Corte prime de 280g, molho de trufa negra, purê de raiz-forte e aspargos grelhados.',
            price: 148,
            imageUrl:
              'https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=600&h=400&fit=crop&auto=format',
            tags: ['Sem Glúten', 'Premium'],
            isAvailable: true,
          },
          {
            name: 'Frango ao Risoto Verde',
            description:
              'Frango empanado crocante sobre risoto de ervas, espinafre e molho de limão siciliano.',
            price: 92,
            imageUrl:
              'https://images.unsplash.com/photo-1784203648814-48943de470c1?w=600&h=400&fit=crop&auto=format',
            isAvailable: true,
          },
          {
            name: 'Robalo com Aspargos',
            description:
              'Filé de robalo pele crocante, caldo de alho-poró, brotos e espuma de limão thai.',
            price: 118,
            imageUrl:
              'https://images.unsplash.com/photo-1782821961510-aa2b6baed210?w=600&h=400&fit=crop&auto=format',
            tags: ['Sem Glúten', 'Peixe'],
            isAvailable: true,
          },
          {
            name: 'Aspargos com Molho Verde',
            description:
              'Aspargos brancos e verdes grelhados com pesto de pistache, ovo 63°C e parmesão envelhecido.',
            price: 78,
            imageUrl:
              'https://images.unsplash.com/photo-1777897466887-9533bf582828?w=600&h=400&fit=crop&auto=format',
            tags: ['Vegetariano'],
            isAvailable: true,
          },
        ],
      },
      {
        name: 'Sobremesas',
        slug: 'sobremesas',
        emoji: '🍫',
        sortOrder: 3,
        isActive: true,
        products: [
          {
            name: 'Bolo de Chocolate',
            description:
              'Bolo úmido de chocolate 70% com ganache morna e sorvete de baunilha bourbon.',
            price: 42,
            imageUrl:
              'https://images.unsplash.com/photo-1682596044365-eb5c3bc51555?w=600&h=400&fit=crop&auto=format',
            isAvailable: true,
          },
          {
            name: 'Tarte de Maçã',
            description: 'Tarte fina com maçã caramelizada, creme de amêndoa e sorvete de canela.',
            price: 38,
            imageUrl:
              'https://images.unsplash.com/photo-1643733645069-76bac4462103?w=600&h=400&fit=crop&auto=format',
            isAvailable: true,
          },
        ],
      },
      {
        name: 'Bebidas',
        slug: 'bebidas',
        emoji: '🍷',
        sortOrder: 4,
        isActive: true,
        products: [
          {
            name: 'Negroni Clássico',
            description:
              'Gin London Dry, Campari e vermute rosso, servido com casca de laranja flamejada.',
            price: 36,
            imageUrl:
              'https://images.unsplash.com/photo-1500217052183-bc01eee1a74e?w=600&h=400&fit=crop&auto=format',
            isAvailable: true,
          },
          {
            name: 'Spritz Rosé',
            description:
              'Aperol, prosecco brut, espumante rosé e limão siciliano com fatia de toranja.',
            price: 28,
            imageUrl:
              'https://images.unsplash.com/photo-1605270012917-bf157c5a9541?w=600&h=400&fit=crop&auto=format',
            isAvailable: true,
          },
          {
            name: 'Martini Dry',
            description:
              'Gin premium com vermute seco, azeitona recheada de limão e twist de limão siciliano.',
            price: 38,
            imageUrl:
              'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?w=600&h=400&fit=crop&auto=format',
            isAvailable: true,
          },
        ],
      },
    ]

    for (const catData of categoriesData) {
      const category = await Category.firstOrCreate(
        { slug: catData.slug },
        {
          name: catData.name,
          slug: catData.slug,
          emoji: catData.emoji,
          sortOrder: catData.sortOrder,
          isActive: catData.isActive,
        }
      )

      for (const prodData of catData.products) {
        await Product.firstOrCreate(
          { categoryId: category.id, name: prodData.name },
          {
            categoryId: category.id,
            name: prodData.name,
            description: prodData.description,
            price: prodData.price,
            imageUrl: prodData.imageUrl,
            tags: prodData.tags ?? null,
            isAvailable: prodData.isAvailable,
          }
        )
      }
    }
  }
}
