-- ==============================================================================
-- Crown Hotels Digital Menu Platform — Seed Data Migration 002
-- PostgreSQL / Supabase Migration
-- Created at: 2026-10-16
-- 1 Property, 4 Outlets, 14 Categories, 63 Menu Items, Modifiers, Pairings, QR Service Points
-- ==============================================================================

DO $$
DECLARE
  v_prop_id UUID := 'a0000000-0000-0000-0000-000000000001'::uuid;
  v_out_rest UUID := 'b0000000-0000-0000-0000-000000000001'::uuid;
  v_out_bar  UUID := 'b0000000-0000-0000-0000-000000000002'::uuid;
  v_out_pool UUID := 'b0000000-0000-0000-0000-000000000003'::uuid;
  v_out_room UUID := 'b0000000-0000-0000-0000-000000000004'::uuid;

  -- Categories
  v_cat_bfast UUID := 'c0000000-0000-0000-0000-000000000001'::uuid;
  v_cat_start UUID := 'c0000000-0000-0000-0000-000000000002'::uuid;
  v_cat_kenya UUID := 'c0000000-0000-0000-0000-000000000003'::uuid;
  v_cat_grill UUID := 'c0000000-0000-0000-0000-000000000004'::uuid;
  v_cat_india UUID := 'c0000000-0000-0000-0000-000000000005'::uuid;
  v_cat_pizza UUID := 'c0000000-0000-0000-0000-000000000006'::uuid;
  v_cat_sides UUID := 'c0000000-0000-0000-0000-000000000007'::uuid;
  v_cat_dsert UUID := 'c0000000-0000-0000-0000-000000000008'::uuid;
  v_cat_softs UUID := 'c0000000-0000-0000-0000-000000000009'::uuid;
  v_cat_hotbv UUID := 'c0000000-0000-0000-0000-000000000010'::uuid;
  v_cat_beers UUID := 'c0000000-0000-0000-0000-000000000011'::uuid;
  v_cat_wines UUID := 'c0000000-0000-0000-0000-000000000012'::uuid;
  v_cat_cktls UUID := 'c0000000-0000-0000-0000-000000000013'::uuid;
  v_cat_kids  UUID := 'c0000000-0000-0000-0000-000000000014'::uuid;

  -- Menu item IDs for key pairings
  v_item_nyama UUID := 'd0000000-0000-0000-0000-000000000011'::uuid;
  v_item_tusker UUID := 'd0000000-0000-0000-0000-000000000048'::uuid;
  v_item_kachumbari UUID := 'd0000000-0000-0000-0000-000000000009'::uuid;
  v_item_ugali UUID := 'd0000000-0000-0000-0000-000000000034'::uuid;
  v_item_dawa UUID := 'd0000000-0000-0000-0000-000000000057'::uuid;

  -- Mod group
  v_mod_side UUID := 'e0000000-0000-0000-0000-000000000001'::uuid;
  v_mod_done UUID := 'e0000000-0000-0000-0000-000000000002'::uuid;
BEGIN
  -- 1. Insert Property
  INSERT INTO properties (id, name, slug, town, address, phone, whatsapp, timezone, service_charge_pct, vat_inclusive, vat_pct, active)
  VALUES (
    v_prop_id,
    'Crown Plaza Nairobi',
    'crown-plaza-nairobi',
    'Nairobi',
    'Upper Hill, Kenya Road, P.O. Box 25574-00100 Nairobi',
    '+254711002000',
    '+254711002000',
    'Africa/Nairobi',
    5.00,
    true,
    16.00,
    true
  ) ON CONFLICT (id) DO NOTHING;

  -- Settings
  INSERT INTO settings (property_id, usd_exchange_rate, retention_days, allow_room_charge, allow_pay_at_table, auto_accept_orders, support_email)
  VALUES (v_prop_id, 130.00, 90, true, true, false, 'dining@crownplaza-nairobi.co.ke')
  ON CONFLICT (property_id) DO NOTHING;

  -- 2. Insert Outlets
  INSERT INTO outlets (id, property_id, name, type, active) VALUES
    (v_out_rest, v_prop_id, 'The Sovereign Restaurant', 'restaurant', true),
    (v_out_bar,  v_prop_id, 'Crown Safari Bar & Lounge', 'bar', true),
    (v_out_pool, v_prop_id, 'Poolside Oasis & Bar', 'poolside', true),
    (v_out_room, v_prop_id, 'Crown In-Room Dining', 'room_service', true)
  ON CONFLICT (id) DO NOTHING;

  -- 3. Insert Categories
  INSERT INTO menu_categories (id, outlet_id, name_en, name_sw, slug, sort_order, daypart_start, daypart_end, is_alcohol, active) VALUES
    (v_cat_bfast, v_out_rest, 'Breakfast', 'Kiamsha Kinywa', 'breakfast', 1, '06:00:00', '11:00:00', false, true),
    (v_cat_start, v_out_rest, 'Starters', 'Vitafunio vya Kuanza', 'starters', 2, NULL, NULL, false, true),
    (v_cat_kenya, v_out_rest, 'Kenyan Classics', 'Vyakula Asili vya Kenya', 'kenyan-classics', 3, NULL, NULL, false, true),
    (v_cat_grill, v_out_rest, 'Grill & Mains', 'Choma na Mlo Mkuu', 'grill-mains', 4, '11:30:00', '23:00:00', false, true),
    (v_cat_india, v_out_rest, 'Indian Delights', 'Vyakula vya Kihindi', 'indian', 5, '11:30:00', '23:00:00', false, true),
    (v_cat_pizza, v_out_rest, 'Pizza & Burgers', 'Piza na Baga', 'pizza-burgers', 6, '11:30:00', '23:30:00', false, true),
    (v_cat_sides, v_out_rest, 'Sides', 'Vyakula vya Pembeni', 'sides', 7, NULL, NULL, false, true),
    (v_cat_dsert, v_out_rest, 'Desserts', 'Vitamutamu vya Baada ya Chakula', 'desserts', 8, NULL, NULL, false, true),
    (v_cat_softs, v_out_rest, 'Soft Drinks & Juices', 'Vinywaji Baridi na Juisi', 'soft-drinks-juices', 9, NULL, NULL, false, true),
    (v_cat_hotbv, v_out_rest, 'Hot Beverages', 'Vinywaji Moto', 'hot-beverages', 10, NULL, NULL, false, true),
    (v_cat_beers, v_out_bar,  'Beers & Ciders', 'Bia na Saida', 'beers-ciders', 11, '12:00:00', '02:00:00', true, true),
    (v_cat_wines, v_out_bar,  'Wines & Spirits', 'Mvinyo na Pombe Kali', 'wines-spirits', 12, '12:00:00', '02:00:00', true, true),
    (v_cat_cktls, v_out_bar,  'Cocktails', 'Kogoti na Vinywaji Maalumu', 'cocktails', 13, '12:00:00', '02:00:00', true, true),
    (v_cat_kids,  v_out_rest, 'Kids Menu', 'Chakula cha Watoto', 'kids', 14, NULL, NULL, false, true)
  ON CONFLICT (id) DO NOTHING;

  -- 4. Insert Menu Items (All 63 Items with exact KES pricing)

  -- BREAKFAST
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000001', v_cat_bfast, 'Kenyan Breakfast', 'Kiamsha Kinywa cha Kenya', 'Freshly fried golden mandazi, flaky chapati, farm-fresh eggs cooked to style, beef or chicken sausage, accompanied by authentic spiced Kenyan chai.', 'Mandazi motomoto ya dhahabu, chapati laini, mayai ya kienyeji, soseji ya ng''ombe au kuku, pamoja na chai halisi ya viungo ya Kenya.', 1200, 15, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'eggs', 'dairy'], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000002', v_cat_bfast, 'Full English', 'Kiamsha Kinywa cha Kiingereza', 'Two eggs any style, grilled back bacon, Cumberland sausage, roasted herb tomatoes, sauteed button mushrooms, baked beans and sourdough toast.', 'Mayai mawili upendavyo, bekoni iliyochomwa, soseji, nyanya zilizookwa kwa viungo, uyoga, maharagwe yaliyopikwa na mkate wa ngano.', 1650, 18, 0, '{"vegetarian":false,"vegan":false,"halal":false,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'eggs', 'pork'], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000003', v_cat_bfast, 'Mahamri & Beans', 'Mahamri na Maharagwe ya Nazi', 'Coastal cardamon mahamri served with slow-cooked red kidney beans simmered in creamy coconut milk and Swahili aromatics.', 'Mahamri laini ya iliki ya pwani yaliyotiwa nazi, yakiliwa na maharagwe ya nazi yaliyochemshwa taratibu kwa viungo vya Kiswahili.', 750, 12, 1, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":false,"dairy_free":true,"nut_free":true}', ARRAY['gluten'], true, false, true, 3),
  ('d0000000-0000-0000-0000-000000000004', v_cat_bfast, 'Pancakes with Honey', 'Pancakes na Asali Safi', 'Fluffy buttermilk pancakes stacked high, served with pure Kenyan organic acacia honey, whipped butter, and fresh seasonal berry compote.', 'Keki nyepesi za kikaangoni zilizopikwa kwa maziwa ya siagi, zikipakuliwa na asali safi ya nyuki ya Kenya, siagi laini na matunda damu.', 850, 12, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy', 'eggs'], true, false, false, 4),
  ('d0000000-0000-0000-0000-000000000005', v_cat_bfast, 'Fruit Platter', 'Sahani ya Matunda Mseto', 'Vibrant seasonal sliced tropical fruits including sweet coastal mango, ripe papaya, sweet pineapple, passion fruit, and watermelon.', 'Matunda safi ya msimu yaliyokatwa kwa ustadi yakiwemo maembe matamu ya pwani, papai lililoiva, nanasi tamu, pasheni na tikitimaji.', 700, 8, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 5)
  ON CONFLICT (id) DO NOTHING;

  -- STARTERS
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000006', v_cat_start, 'Beef Samosas (4)', 'Sambusa za Nyama ya Ng''ombe (4)', 'Crispy golden triangular pastry pockets stuffed with seasoned minced prime beef, coriander, spring onions, and gentle cumin, served with lime wedges.', 'Sambusa nne za dhahabu zenye ngozi nyembamba na nyama ya kusaga ya ng''ombe iliyotiwa dania, vitunguu na bizari, zikiliwa na ndimu.', 650, 10, 1, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":true,"nut_free":true}', ARRAY['gluten'], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000007', v_cat_start, 'Chicken Wings', 'Mabawa ya Kuku ya Kuchoma', 'Tender chicken wings glazed in our signature sticky peri-peri and honey barbecue marinade, garnished with fresh toasted sesame seeds.', 'Mabawa ya kuku laini yaliyochomwa na kupakwa mchuzi wa pilipili tamu na asali, yakinyunyiziwa ufuta uliokaangwa.', 950, 15, 2, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":false}', ARRAY['sesame'], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000008', v_cat_start, 'Fish Fingers & Tartare', 'Vipande vya Samaki na Tartare', 'Crisp panko-crusted Lake Victoria Nile perch strips served with house-made caper and dill tartare sauce and lemon wedges.', 'Vipande vya samaki sangara kutoka Ziwa Victoria vilivyoviringishwa kwenye mkate mkavu vikakaangwa, vikipakuliwa na mchuzi wa tartare na limau.', 1100, 14, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['fish', 'gluten', 'eggs'], true, false, false, 3),
  (v_item_kachumbari, v_cat_start, 'Kachumbari Salad', 'Saladi ya Kachumbari', 'Classic East African fresh salad of finely diced vine tomatoes, red onions, fresh coriander, spicy green chilies, and a zesty fresh lime dressing.', 'Saladi asili ya Afrika Mashariki ya nyanya zilizoiva, vitunguu vyekundu, dania safi, pilipili kali na maji ya ndimu safi.', 450, 6, 1, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 4),
  ('d0000000-0000-0000-0000-000000000010', v_cat_start, 'Tomato Basil Soup', 'Supu ya Nyanya na Rehani', 'Velvety roasted plum tomato and sweet basil soup, finished with a swirl of double cream and crunchy herb garlic croutons.', 'Supu nzito na nyororo ya nyanya zilizookwa na majani ya basil, ikiwekwa krimu kidogo na vipande vidogo vya mkate wa vitunguu saumu.', 600, 10, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy'], true, false, false, 5)
  ON CONFLICT (id) DO NOTHING;

  -- KENYAN CLASSICS
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  (v_item_nyama, v_cat_kenya, 'Nyama Choma ½kg with Ugali & Kachumbari', 'Nyama Choma Nusu Kilo, Ugali na Kachumbari', 'Open-flame grilled tender goat or beef cuts, seasoned with sea salt, served sizzling on a rustic wooden board with steaming hot white ugali and zesty kachumbari.', 'Nyama laini ya mbuzi au ng''ombe iliyochomwa kwenye makaa ya moto, ikipakuliwa kwenye kibao cha mbao ikiwa na ugali moto wa unga wa mahindi na kachumbari.', 1800, 25, 1, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000012', v_cat_kenya, 'Ugali, Sukuma Wiki & Beef Stew', 'Ugali, Sukuma Wiki na Mchuzi wa Nyama', 'Traditional slow-braised tender beef simmered in rich tomato, garlic, and onion gravy, paired with fresh sauteed collard greens and authentic ugali.', 'Nyama ya ng''ombe iliyotokotwa taratibu kwenye mchuzi mzito wa nyanya na vitunguu, ikiliwa na sukuma wiki iliyokaangwa vizuri na ugali mtamu.', 950, 18, 1, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, true, false, 2),
  ('d0000000-0000-0000-0000-000000000013', v_cat_kenya, 'Chicken Pilau', 'Pilau ya Kuku wa Kienyeji', 'Fragrant basmati rice gently spiced with coastal whole cumin, cardamon, cloves, cinnamon, and tender pieces of marinated chicken, served with fresh kachumbari.', 'Wali wa basmati wenye harufu nzuri ya viungo vya pilau vya pwani, vipande laini vya kuku, ukisindikizwa na kachumbari safi ya ndimu.', 1100, 20, 1, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, true, false, 3),
  ('d0000000-0000-0000-0000-000000000014', v_cat_kenya, 'Mukimo with Beef Stew', 'Mukimo na Mchuzi wa Nyama', 'Traditional Central Kenya mashed potatoes blended with sweet pumpkin leaves, fresh green maize, and peas, served alongside rich savoury beef stew.', 'Mukimo halisi ya viazi, kahurura, mahindi mabichi na njegere, ikipakuliwa na mchuzi mzito wenye vipande vya nyama ya ng''ombe.', 1050, 18, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, true, 4),
  ('d0000000-0000-0000-0000-000000000015', v_cat_kenya, 'Githeri Special', 'Githeri Maalumu cha Kukaanga', 'Simmered whole maize and red beans sauteed with sweet onions, ripe tomatoes, fresh spinach, carrots, and subtle curry aromatics.', 'Mchanganyiko wa mahindi na maharagwe yaliyochemshwa kisha kukaangwa na vitunguu, nyanya, mchicha safi na karoti.', 700, 15, 1, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 5),
  ('d0000000-0000-0000-0000-000000000016', v_cat_kenya, 'Swahili Fish Curry & Coconut Rice', 'Mchuzi wa Samaki wa Nazi na Wali', 'Fresh red snapper fillet simmered in a creamy coastal coconut milk sauce infused with turmeric, ginger, garlic, and tamarind, served with aromatic coconut rice.', 'Kitoweo cha samaki katika mchuzi wa nazi uliokolea manjano, tangawizi na ukwaju, kikipakuliwa na wali safi wa nazi.', 1650, 20, 2, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY['fish'], true, false, true, 6),
  ('d0000000-0000-0000-0000-000000000017', v_cat_kenya, 'Whole Fried Tilapia, Ugali & Greens', 'Ngege Mzima wa Kukaanga, Ugali na Mboga', 'Crisp-fried whole freshwater tilapia from Lake Victoria, seasoned with sea salt and garlic, accompanied by hot white ugali and seasoned traditional greens.', 'Samaki tilapia mzima aliyekaangwa kwa mafuta akawa mkavu na mtamu, akipakuliwa na ugali moto na mboga za kienyeji.', 1750, 22, 1, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY['fish'], true, true, true, 7),
  ('d0000000-0000-0000-0000-000000000018', v_cat_kenya, 'Matoke in Coconut', 'Matoke ya Nazi na Mboga', 'Tender green plantain bananas braised gently in velvety coconut cream with bell peppers, sweet red onions, and fresh ground coriander.', 'Ndizi mbichi za kupika zilizotokotwa vizuri katika tui zito la nazi, hoho na vitunguu vyekundu.', 800, 16, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 8)
  ON CONFLICT (id) DO NOTHING;

  -- GRILL & MAINS
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000019', v_cat_grill, 'Beef Steak', 'Stiki ya Nyama ya Ng''ombe', 'Prime 28-day aged Kenyan beef sirloin (300g) grilled to your preference, served with Madagascar green peppercorn jus, roasted baby carrots, and hand-cut fries.', 'Nyama stiki ya ng''ombe (gramu 300) iliyochomwa kulingana na chaguo lako, ikipakuliwa na mchuzi wa pilipili manga na viazi vya kukaanga.', 2400, 22, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['dairy'], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000020', v_cat_grill, 'Grilled Chicken Half', 'Nusu Kuku wa Kuchoma', 'Corn-fed half spring chicken marinated for 24 hours in garlic, rosemary, and lemon, flame-grilled until golden and juicy, served with chips or salad.', 'Nusu kuku aliyeokwa na viungo vya vitunguu saumu, rozimari na ndimu, akachomwa hadi kuwa wa dhahabu, akipakuliwa na chipsi.', 1500, 20, 1, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000021', v_cat_grill, 'Lamb Chops', 'Mbavu za Kondoo za Kuchoma', 'Tender highland lamb chops marinated with fresh mint, wild thyme, and cracked black pepper, flame-seared, served with minted jus and roasted garlic mash.', 'Mbavu laini za nyama ya kondoo zilizotiwa viungo vya mnanaa na thaimu, zikachomwa na kupakuliwa na viazi vilivyopondwa.', 2600, 22, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['dairy'], true, false, true, 3),
  ('d0000000-0000-0000-0000-000000000022', v_cat_grill, 'Pan-Seared Nile Perch', 'Samaki Sangara wa Kikaango', 'Lake Victoria perch fillet seared with herb butter and capers, served over creamy saffron risotto and buttered baby spinach.', 'Sangara mnono kutoka Ziwa Victoria aliyekaangwa na siagi ya mimea, akipakuliwa juu ya wali wa zafarani na mchicha laini.', 1950, 18, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['fish', 'dairy'], true, false, false, 4),
  ('d0000000-0000-0000-0000-000000000023', v_cat_grill, 'Vegetable Curry (vegan)', 'Kari ya Mbogamboga (Mlo Bila Wanyama)', 'Seasonal garden vegetables, chickpeas, and cauliflower florets simmered in aromatic yellow curry sauce with coconut milk and cumin rice.', 'Mbogamboga za shambani, njegere za dengu na koliflawa zilizopikwa katika mchuzi mzito wa manjano na tui la nazi, zikipakuliwa na wali.', 1050, 16, 2, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 5)
  ON CONFLICT (id) DO NOTHING;

  -- INDIAN
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000024', v_cat_india, 'Butter Chicken & Naan', 'Kuku wa Siagi na Naan', 'Tandoor-charred chicken thigh fillets simmered in rich satin-smooth tomato, cashew nut, and butter gravy, served with fluffy garlic butter naan.', 'Vipande vya kuku wa tandoori katika mchuzi laini wa nyanya, korosho na siagi, vikipakuliwa na mkate wa naan wa siagi na vitunguu saumu.', 1500, 18, 1, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":false}', ARRAY['dairy', 'nuts', 'gluten'], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000025', v_cat_india, 'Chicken Biryani', 'Biriani ya Kuku', 'Dum-style layered fragrant basmati rice with spiced chicken, caramelized onions, saffron, and fresh mint, served with cooling cucumber raita.', 'Wali wa basmati na vipande vya kuku vilivyotiwa viungo vya biriani, vitunguu vilivyokaangwa na zafarani, ukipakuliwa na saladi ya mtindi.', 1400, 20, 2, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['dairy'], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000026', v_cat_india, 'Paneer Tikka Masala', 'Jibini ya Paneer Tikka Masala', 'Fresh cottage cheese cubes marinated in tandoori spices, char-grilled and tossed in a rich, spiced bell pepper and onion masala gravy.', 'Jibini laini ya paneer iliyotiwa viungo na kuchomwa kwenye tandoori, kisha ikapikwa kwenye mchuzi wa masala wenye hoho na vitunguu.', 1300, 16, 2, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['dairy'], true, false, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- PIZZA & BURGERS
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000027', v_cat_pizza, 'Margherita', 'Piza ya Margherita', 'Hand-stretched sourdough crust with San Marzano tomato sauce, fresh creamy buffalo mozzarella, extra virgin olive oil, and sweet garden basil.', 'Piza ya unga ulioumuliwa vizuri, mchuzi wa nyanya safi, jibini ya mozzarella, mafuta ya zeituni na majani ya basil.', 1200, 15, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy'], true, false, false, 1),
  ('d0000000-0000-0000-0000-000000000028', v_cat_pizza, 'Crown Chicken Burger', 'Baga ya Kuku ya Crown', 'Crispy buttermilk-fried chicken breast, melted aged cheddar, tangy purple slaw, and peri-peri mayo on a toasted brioche bun with rustic fries.', 'Kuku aliyekaangwa kwa unga mkavu na siagi ya maziwa, jibini ya cheddar iliyoyeyuka, saladi ya kabichi na mchuzi wa peri-peri kwenye mkate wa brioche.', 1300, 16, 1, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy', 'eggs'], true, true, false, 2),
  ('d0000000-0000-0000-0000-000000000029', v_cat_pizza, 'Beef Burger & Fries', 'Baga ya Nyama ya Ng''ombe na Chipsi', 'Prime 200g smashed beef patty, caramelized balsamic onions, sharp cheddar, gherkins, crisp butter lettuce, and secret Crown burger sauce with crisp fries.', 'Nyama safi ya ng''ombe (gramu 200), vitunguu vitamu vilivyokaangwa, jibini ya cheddar, kachumbari ndogo za tango na mchuzi maalum wa Crown.', 1450, 16, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy', 'eggs'], true, true, true, 3)
  ON CONFLICT (id) DO NOTHING;

  -- SIDES
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000030', v_cat_sides, 'Chips', 'Chipsi za Kukaanga', 'Crispy golden potato fries lightly tossed with sea salt.', 'Viazi vya kukaangwa kwa mafuta safi hadi kuwa vya dhahabu na chumvi kidogo.', 400, 10, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 1),
  ('d0000000-0000-0000-0000-000000000031', v_cat_sides, 'Chapati', 'Chapati Laini', 'Two layered flaky East African flatbreads cooked with vegetable oil.', 'Chapati mbili laini za tabataba zilizopikwa kwa unga wa ngano.', 150, 8, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":false,"dairy_free":true,"nut_free":true}', ARRAY['gluten'], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000032', v_cat_sides, 'Steamed Rice', 'Wali Mweupe', 'Fluffy fragrant steamed long-grain basmati rice.', 'Wali mweupe uliopikwa vizuri wenye chembe zilizojitenga.', 300, 8, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 3),
  ('d0000000-0000-0000-0000-000000000033', v_cat_sides, 'Sukuma Wiki', 'Sukuma Wiki ya Kukaanga', 'Finely shredded collard greens sauteed with diced onions and fresh tomatoes.', 'Sukuma wiki iliyokatwa vizuri na kukaangwa kwa vitunguu na nyanya.', 250, 8, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 4),
  (v_item_ugali, v_cat_sides, 'Ugali', 'Ugali Safi wa Mahindi', 'Steaming hot authentic white maize meal porridge cake.', 'Ugali moto na mzito uliopikwa kwa unga safi wa mahindi meupe.', 200, 8, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 5)
  ON CONFLICT (id) DO NOTHING;

  -- DESSERTS
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000035', v_cat_dsert, 'Chocolate Fondant', 'Keki ya Chokoleti Laini', 'Warm Belgian dark chocolate cake with a molten lava center, served with Madagascan vanilla bean gelato.', 'Keki ya chokoleti ya moto inayomiminika ndani, ikipakuliwa na aiskrimu ya vanila.', 750, 14, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy', 'eggs'], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000036', v_cat_dsert, 'Mango Cheesecake', 'Keki ya Jibini ya Embe la Pwani', 'New York style baked cheesecake infused with sweet Malindi mango puree on a buttery biscuit base.', 'Keki tamu ya jibini iliyotiwa sharubati ya embe la Malindi juu ya biskuti ya siagi.', 700, 10, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy'], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000037', v_cat_dsert, 'Fruit Salad', 'Saladi ya Matunda Tamu', 'Diced seasonal tropical fruits drizzled with fresh passion fruit coulis.', 'Matunda mseto ya msimu yaliyokatwa yakinyunyiziwa maji ya pasheni safi.', 500, 6, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 3),
  ('d0000000-0000-0000-0000-000000000038', v_cat_dsert, 'Ice Cream (3 scoops)', 'Aiskrimu (Mipira 3)', 'Three scoops of premium artisan ice cream. Choose from Vanilla Bean, Dark Chocolate, and Strawberry.', 'Mipira mitatu ya aiskrimu bora: Vanila, Chokoleti, au Sitroberi.', 550, 5, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['dairy'], true, false, false, 4)
  ON CONFLICT (id) DO NOTHING;

  -- SOFT DRINKS & JUICES
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000039', v_cat_softs, 'Soda', 'Soda ya Chupa', 'Chilled 300ml glass bottle: Coca-Cola, Sprite, Fanta Orange, or Krest Bitter Lemon.', 'Soda ya glasi ya mililita 300: Koka, Sprite, Fanta, au Krest.', 250, 3, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 1),
  ('d0000000-0000-0000-0000-000000000040', v_cat_softs, 'Still Water', 'Maji Safi ya Kunywa', 'Premium 500ml mineral still water bottle served chilled with lemon slice upon request.', 'Maji ya chupa ya mililita 500 yaliyopozwa, yakiliwa na kipande cha limau.', 200, 2, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000041', v_cat_softs, 'Fresh Passion Juice', 'Juisi Safi ya Pasheni', 'Freshly pressed Kenyan highland passion fruit juice, served over crushed ice.', 'Juisi iliyokamuliwa kutoka kwa pasheni safi za nyanda za juu za Kenya.', 450, 5, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, true, false, 3),
  ('d0000000-0000-0000-0000-000000000042', v_cat_softs, 'Fresh Mango Juice', 'Juisi Safi ya Embe', 'Sun-ripened coastal mango blended smooth and chilled.', 'Juisi nzito ya maembe yaliyoiva ya pwani, ikipakuliwa ikiwa baridi.', 450, 5, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 4),
  ('d0000000-0000-0000-0000-000000000043', v_cat_softs, 'Tree Tomato Juice', 'Juisi Safi ya Matunda ya Damu (Tree Tomato)', 'Tangy, antioxidant-rich tamarillo juice blended fresh with a hint of honey.', 'Juisi ya matunda damu (tamarillo) yenye asidi kidogo na asali, ikiburudisha sana.', 450, 5, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, true, 5)
  ON CONFLICT (id) DO NOTHING;

  -- HOT BEVERAGES
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000044', v_cat_hotbv, 'Kenyan Chai', 'Chai ya Maziwa ya Kenya', 'Authentic Kericho black tea leaves brewed with rich whole milk and crushed ginger.', 'Chai halisi ya majani ya Kericho iliyotokotwa kwa maziwa na tangawizi.', 300, 6, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['dairy'], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000045', v_cat_hotbv, 'Kenyan Coffee', 'Kahawa Halisi ya Kenya', 'Single-origin Kenya AA Arabica coffee brewed in a traditional French press.', 'Kahawa bora ya Kenya AA iliyosagwa na kutengenezwa kwa mtindo wa French press.', 350, 6, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000046', v_cat_hotbv, 'Cappuccino', 'Kahawa ya Cappuccino', 'Double espresso shot balanced with steamed milk and thick velvety micro-foam, dusted with dark cocoa.', 'Kahawa ya espresso yenye maziwa moto ya povu na chokoleti kidogo juu.', 400, 5, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['dairy'], true, false, false, 3),
  ('d0000000-0000-0000-0000-000000000047', v_cat_hotbv, 'Masala Tea', 'Chai ya Masala yenye Viungo', 'Spiced tea brewed with whole green cardamom, cinnamon quill, cloves, and ginger in milk.', 'Chai ya viungo mseto: iliki, mdalasini, karafuu na tangawizi katika maziwa.', 350, 6, 1, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":true,"dairy_free":false,"nut_free":true}', ARRAY['dairy'], true, false, false, 4)
  ON CONFLICT (id) DO NOTHING;

  -- BEERS & CIDERS (Alcohol 18+)
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  (v_item_tusker, v_cat_beers, 'Tusker Lager', 'Bia ya Tusker Lager', 'Kenya''s legendary 500ml golden lager, brewed from 100% African ingredients since 1922. Crisp and refreshing.', 'Bia maarufu ya Kenya tangu mwaka 1922, iliyotengenezwa kwa viungo asilia vya Kiafrika.', 400, 2, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":false,"dairy_free":true,"nut_free":true}', ARRAY['gluten'], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000049', v_cat_beers, 'Tusker Malt', 'Bia ya Tusker Malt', 'Premium 330ml 100% malted barley lager, expertly brewed for a smooth, full-bodied flavour.', 'Bia ya kimea cha shayiri asilimia mia moja, yenye ladha nzito na ya kipekee.', 450, 2, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":false,"dairy_free":true,"nut_free":true}', ARRAY['gluten'], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000050', v_cat_beers, 'White Cap', 'Bia ya White Cap', 'Clean, crisp 500ml Kenyan lager brewed with natural mountain water. Extremely easy drinking.', 'Bia nyepesi na safi ya mililita 500, inayoburudisha wakati wowote.', 400, 2, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":false,"dairy_free":true,"nut_free":true}', ARRAY['gluten'], true, false, false, 3),
  ('d0000000-0000-0000-0000-000000000051', v_cat_beers, 'Guinness', 'Bia ya Guinness', 'Extra smooth foreign stout (500ml) with rich roasted barley flavours and a creamy head.', 'Bia nyeusi na nzito ya kimea kilichokaangwa, yenye ladha shupavu.', 450, 2, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":false,"dairy_free":true,"nut_free":true}', ARRAY['gluten'], true, false, false, 4),
  ('d0000000-0000-0000-0000-000000000052', v_cat_beers, 'Savanna Dry', 'Saida ya Savanna Dry', 'Crisp dry South African apple cider (330ml), served ice-cold with a fresh lemon wedge.', 'Saida ya tufaha baridi iliyotengenezwa Afrika Kusini, ikipakuliwa na limau.', 450, 2, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 5)
  ON CONFLICT (id) DO NOTHING;

  -- WINES & SPIRITS (Alcohol 18+)
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000053', v_cat_wines, 'House Red/White (glass)', 'Glasi ya Mvinyo Mwekundu/Mweupe', 'Selected estate South African Cabernet Sauvignon or Sauvignon Blanc served by the glass (150ml).', 'Glasi ya mvinyo bora wa Afrika Kusini mwekundu au mweupe.', 800, 3, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY['sulphites'], true, false, false, 1),
  ('d0000000-0000-0000-0000-000000000054', v_cat_wines, 'Bottle of Wine', 'Chupa ya Mvinyo', 'Premium 750ml bottle of Stellenbosch Reserve Shiraz or Chenin Blanc.', 'Chupa nzima ya mililita 750 ya mvinyo mzuri kutoka Stellenbosch.', 3500, 3, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY['sulphites'], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000055', v_cat_wines, 'Whisky (tot)', 'Kipimo cha Whisky (Tot)', 'Single measure (30ml) of premium Johnnie Walker Black Label or Glenfiddich 12-Year.', 'Kipimo kimoja cha whisky bora ya miaka 12.', 600, 2, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 3),
  ('d0000000-0000-0000-0000-000000000056', v_cat_wines, 'Gin & Tonic', 'Kinywaji cha Jini na Toniki', 'Tanqueray London Dry Gin paired with premium Indian tonic water, lime wheel, and juniper berries.', 'Jini safi ya Tanqueray ikichanganywa na maji ya toniki na ndimu.', 700, 3, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 4)
  ON CONFLICT (id) DO NOTHING;

  -- COCKTAILS
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  (v_item_dawa, v_cat_cktls, 'Dawa', 'Kogoti ya Dawa Halisi ya Kenya', 'Kenya''s iconic cocktail: premium vodka, freshly muddled lime quarters, crushed ice, and local acacia honey churned with a genuine Dawa wooden stick.', 'Kogoti maarufu zaidi ya Kenya: vodika, vipande vya ndimu, barafu, na asali safi iliyokorogwa kwa kijiti cha Dawa.', 800, 4, 0, '{"vegetarian":true,"vegan":false,"halal":false,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, true, true, 1),
  ('d0000000-0000-0000-0000-000000000058', v_cat_cktls, 'Mojito', 'Kogoti ya Mojito', 'White rum muddled with fresh spearmint leaves, juicy lime, cane sugar, topped with chilled club soda.', 'Ram nyeupe iliyochanganywa na majani ya mnanaa, ndimu, sukari na soda.', 850, 4, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000059', v_cat_cktls, 'Old Fashioned', 'Kogoti ya Old Fashioned', 'Bourbon whiskey stirred smoothly with Angostura aromatic bitters, brown sugar cube, and orange peel expression.', 'Viski ya bourbon iliyochanganywa na matone ya bitters, sukari na ganda la chungwa.', 950, 4, 0, '{"vegetarian":true,"vegan":true,"halal":false,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, false, 3),
  ('d0000000-0000-0000-0000-000000000060', v_cat_cktls, 'Mocktail of the Day', 'Kinywaji Maalumu cha Siku (Bila Pombe)', 'Non-alcoholic refreshing blend of passion fruit, crushed fresh mint, pineapple juice, and ginger fizz.', 'Kinywaji baridi kisicho na pombe cha pasheni, nanasi, mnanaa na tangawizi.', 600, 4, 0, '{"vegetarian":true,"vegan":true,"halal":true,"gluten_free":true,"dairy_free":true,"nut_free":true}', ARRAY[]::text[], true, false, true, 4)
  ON CONFLICT (id) DO NOTHING;

  -- KIDS
  INSERT INTO menu_items (id, category_id, name_en, name_sw, description_en, description_sw, price_kes, prep_minutes, spice_level, dietary_flags, allergens, is_available, is_featured, is_chefs_pick, sort_order) VALUES
  ('d0000000-0000-0000-0000-000000000061', v_cat_kids, 'Kids Chicken & Chips', 'Kuku na Chipsi za Watoto', 'Crispy chicken breast tenders served with golden chips and mild tomato dip.', 'Vipande laini vya kuku vilivyokaangwa na chipsi za viazi.', 750, 12, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":true,"nut_free":true}', ARRAY['gluten'], true, false, false, 1),
  ('d0000000-0000-0000-0000-000000000062', v_cat_kids, 'Mini Burger', 'Baga Ndogo ya Watoto', 'Single mini 100g beef slider patty with melted mild cheese, lettuce, and chips.', 'Baga ndogo ya nyama ya ng''ombe na jibini na chipsi.', 700, 12, 0, '{"vegetarian":false,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy'], true, false, false, 2),
  ('d0000000-0000-0000-0000-000000000063', v_cat_kids, 'Pasta Napoli', 'Pasta ya Napoli', 'Penne pasta tossed in a sweet Italian plum tomato sauce with parmesan cheese on the side.', 'Pasta ndogo ya mchuzi wa nyanya mtamu na jibini ya parmesan.', 650, 12, 0, '{"vegetarian":true,"vegan":false,"halal":true,"gluten_free":false,"dairy_free":false,"nut_free":true}', ARRAY['gluten', 'dairy'], true, false, false, 3)
  ON CONFLICT (id) DO NOTHING;

  -- 5. MODIFIER GROUPS & MODIFIERS
  -- Sides Group for Grill & Mains
  INSERT INTO modifier_groups (id, category_id, name_en, name_sw, min_select, max_select, is_required, sort_order)
  VALUES (v_mod_side, v_cat_grill, 'Choose Your Complimentary Side', 'Chagua Chakula cha Pembeni', 1, 1, true, 1)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO modifiers (group_id, name_en, name_sw, price_delta_kes, is_default, sort_order) VALUES
    (v_mod_side, 'French Fries (Chips)', 'Chipsi za Viazi', 0, true, 1),
    (v_mod_side, 'Steamed White Ugali', 'Ugali Mweupe', 0, false, 2),
    (v_mod_side, 'Traditional Mukimo', 'Mukimo ya Kienyeji', 100, false, 3),
    (v_mod_side, 'Fragrant Basmati Rice', 'Wali wa Basmati', 0, false, 4),
    (v_mod_side, 'Fresh Green Salad', 'Saladi ya Mboga Safi', 0, false, 5)
  ON CONFLICT DO NOTHING;

  -- Meat Doneness for Steaks
  INSERT INTO modifier_groups (id, item_id, name_en, name_sw, min_select, max_select, is_required, sort_order)
  VALUES ('e0000000-0000-0000-0000-000000000003'::uuid, 'd0000000-0000-0000-0000-000000000019'::uuid, 'Meat Doneness', 'Kiwango cha Kuchoma Nyama', 1, 1, true, 1)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO modifiers (group_id, name_en, name_sw, price_delta_kes, is_default, sort_order) VALUES
    ('e0000000-0000-0000-0000-000000000003'::uuid, 'Rare', 'Iliyoiva Kidogo Tu', 0, false, 1),
    ('e0000000-0000-0000-0000-000000000003'::uuid, 'Medium Rare', 'Iliyoiva Kiasi na Damu Kidogo', 0, true, 2),
    ('e0000000-0000-0000-0000-000000000003'::uuid, 'Medium', 'Iliyoiva Kiasi cha Kati', 0, false, 3),
    ('e0000000-0000-0000-0000-000000000003'::uuid, 'Well Done', 'Iliyoiva Kabisa', 0, false, 4)
  ON CONFLICT DO NOTHING;

  -- 6. ITEM PAIRINGS (Upsell Engine)
  INSERT INTO pairings (item_id, suggested_item_id, note_en, note_sw, sort_order) VALUES
    (v_item_nyama, v_item_tusker, 'Nyama Choma pairs classically with an ice-cold Tusker Lager', 'Nyama choma inafaa sana na Tusker baridi', 1),
    (v_item_nyama, v_item_kachumbari, 'Add extra crisp Kachumbari salad', 'Ongeza kachumbari safi', 2),
    (v_item_nyama, v_item_ugali, 'Extra hot ugali portion', 'Ugali wa ziada wa moto', 3),
    ('d0000000-0000-0000-0000-000000000006'::uuid, v_item_tusker, 'Samosas pair nicely with cold beer', 'Sambusa na bia baridi', 1),
    ('d0000000-0000-0000-0000-000000000019'::uuid, 'd0000000-0000-0000-0000-000000000053'::uuid, 'Enjoy with a glass of estate Cabernet Sauvignon', 'Stiki na glasi ya mvinyo mwekundu', 1),
    (v_item_dawa, 'd0000000-0000-0000-0000-000000000006'::uuid, 'Pair your Dawa with hot crispy beef samosas', 'Dawa na sambusa motomoto', 1)
  ON CONFLICT DO NOTHING;

  -- 7. SERVICE POINTS (Tables, Rooms, Poolside, Bar with unguessable tokens)
  INSERT INTO service_points (outlet_id, type, label, qr_token, active) VALUES
    (v_out_rest, 'table', 'Table 1', 'crn_tbl_8f3a9e2c4d1b7a6e5f80123456789abc', true),
    (v_out_rest, 'table', 'Table 2', 'crn_tbl_9a4b8c7d6e5f1029384756abcdef0123', true),
    (v_out_rest, 'table', 'Table 3', 'crn_tbl_1f2e3d4c5b6a7980fedcba9876543210', true),
    (v_out_rest, 'table', 'Table 4', 'crn_tbl_5e6d7c8b9a0f123456789abcdef04821', true),
    (v_out_rest, 'table', 'Table 10 (Terrace)', 'crn_tbl_terr_7a8b9c0d1e2f3a4b5c6d7e8f9012', true),
    (v_out_bar,  'bar',   'Bar Seat 1', 'crn_bar_01ab23cd45ef6789abcdef0123456789', true),
    (v_out_bar,  'bar',   'Bar Seat 2', 'crn_bar_fe45dc32ba9876543210fedcba987654', true),
    (v_out_pool, 'poolside', 'Poolside Lounger 4', 'crn_pol_4a5b6c7d8e9f0123456789abcdef40', true),
    (v_out_pool, 'poolside', 'Poolside Lounger 8', 'crn_pol_8a9b0c1d2e3f456789abcdef012348', true),
    (v_out_room, 'room',  'Room 204 (Executive Suite)', 'crn_rom_204e_9876543210abcdef0123456789ab', true),
    (v_out_room, 'room',  'Room 312 (Deluxe View)', 'crn_rom_312d_1234567890abcdef1234567890ab', true)
  ON CONFLICT (qr_token) DO NOTHING;

END $$;
