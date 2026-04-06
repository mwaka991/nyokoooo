-- ============================================================================
-- SUPABASE SQL COMMANDS - UPDATE CATEGORIES & VIDEOS
-- ============================================================================
-- Run these in Supabase SQL Editor: supabase.com → Project → SQL Editor

-- Step 1: CLEAR EXISTING DATA (if updating)
DELETE FROM videos;
DELETE FROM categories;

-- Step 2: INSERT CATEGORIES
INSERT INTO categories (name, slug, description, is_premium, is_active, sort_order) VALUES
  ('Za moto', 'za-moto', 'Hot and steamy content', FALSE, TRUE, 1),
  ('Za Kizungu', 'za-kizungu', 'Real life stories', FALSE, TRUE, 2),
  ('Za Kibongo', 'za-kibongo', 'Music and rhythm', FALSE, TRUE, 3),
  ('Muvi za kikubwa', 'muvi-za-kikubwa', 'Feature films', FALSE, TRUE, 4),
  ('Connections', 'connections', 'Premium exclusive content', TRUE, TRUE, 5),
  ('Vibao Kata Uchi', 'vibao-kata-uchi', 'Ultra premium uncensored', TRUE, TRUE, 6);

-- Step 3: GET CATEGORY IDs (you'll need these)
-- Run this to see the IDs:
SELECT id, name, is_premium FROM categories;

-- Step 4: INSERT VIDEOS
-- Copy the category IDs from Step 3 and replace {CAT_ID_*} below

-- Za moto videos (12 total)
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ({CAT_ID_ZA_MOTO}, 'Part 1: Demu wa chuo Mwaka wa pili kenya akiwa geto na msela', 'Beauty content part 1', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290988/4_5919986924268820430_csfoiv.mp4', TRUE, 1),
  ({CAT_ID_ZA_MOTO}, 'Part 2: Dudu washa tamu likimpa raha mrembo', 'Beauty content part 2', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290989/4_5920084170918336561_czurwm.mp4', TRUE, 2),
  ({CAT_ID_ZA_MOTO}, 'Part 3: Hii style tamu lazima ukojoe', 'Beauty content part 3', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291002/4_5929098104681798158_qjoelp.mp4', TRUE, 3),
  ({CAT_ID_ZA_MOTO}, 'Part 4: Ukipewa kuma hakikisha unaisugua vizuri mpaka mchumba akojoe', 'Beauty content part 4', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290982/4_5920229177604184598_gotv8c.mp4', TRUE, 4),
  ({CAT_ID_ZA_MOTO}, 'Part 5: Pisi imetombwa mpaka ikaomba poo', 'Beauty content part 5', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291014/4_5922708301446912231_pt5tvl.mp4', TRUE, 5),
  ({CAT_ID_ZA_MOTO}, 'P1: Dada anajua kucheza na Dudu kubwa tamu', 'Beauty content P1', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291023/4_5953879438914493546_a02m7b.mp4', TRUE, 6),
  ({CAT_ID_ZA_MOTO}, 'P2: Dudu washa likimkuna vizuri mpaka akafika kileleni', 'Beauty content P2', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291029/4_5954243171104856489_zbvzqs.mp4', TRUE, 7),
  ({CAT_ID_ZA_MOTO}, 'P1: Mrembo anajua namna ya kucheza na mboo', 'Beauty content P1', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290966/4_5902030739746068875_fluekk.mp4', TRUE, 8),
  ({CAT_ID_ZA_MOTO}, 'P2: Kitombo safi kwenye gari', 'Beauty content P2', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290975/4_5904551911318623603_wb1kex.mp4', TRUE, 9),
  ({CAT_ID_ZA_MOTO}, 'Asubuhi haipiti bila kumpa haki yake mke wangu', 'Beauty content', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290955/4_5870712753051670788_vhbs3c.mp4', TRUE, 10),
  ({CAT_ID_ZA_MOTO}, 'Mke wangu anapenda sana Mboo yangu kila asubuhi lazima nimkune', 'Beauty content', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290954/4_5870504837979838456_luqsq5.mp4', TRUE, 11),
  ({CAT_ID_ZA_MOTO}, 'Boyfrend wake yupo bize na kazi amekuja geto nimkune vizuri', 'Beauty content', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290990/4_5920253710457378270_ya99gz.mp4', TRUE, 12);

-- Za Kizungu videos (32 total - inserting first 10 as example)
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ({CAT_ID_ZA_KIZUNGU}, 'Wanawake hawataki huruma wanataka kutombwa kweli kweli', 'Real life 1', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773329244/4_5821134227567022482_hdhgfb.mp4', TRUE, 1),
  ({CAT_ID_ZA_KIZUNGU}, 'Bibi akikunwa vizuri na mjukuu wa rafiki yake', 'Real life 2', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330118/4_5780921526811368043_eaulvj.mp4', TRUE, 2),
  ({CAT_ID_ZA_KIZUNGU}, 'Demu ametombwa vizuri mpaka amekojoa', 'Real life 3', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417768/1_5100426161108813621_o777ix.mp4', TRUE, 3),
  ({CAT_ID_ZA_KIZUNGU}, 'Binamu kautaka', 'Real life 4', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417749/4_5803278553868931253_f1bznn.mp4', TRUE, 4),
  ({CAT_ID_ZA_KIZUNGU}, 'Mtombaji wa kweli hachagui eneo', 'Real life 5', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417869/4_5834522649945971720_aitecr.mp4', TRUE, 5),
  ({CAT_ID_ZA_KIZUNGU}, 'Housegirl ameamka na nyege ikabidi Boss ampe dudu washa', 'Real life 6', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773418614/4_5841478431086224284_eavojh.mp4', TRUE, 6),
  ({CAT_ID_ZA_KIZUNGU}, 'Demu aki enjoy utamu na Boyfrend wake', 'Real life 7', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417779/4_5830036273137457188_vqpiwu.mp4', TRUE, 7),
  ({CAT_ID_ZA_KIZUNGU}, 'Demu akilamba lolo kwa ufundi kisha akatombwa mpaka akarusha maji ya utamu', 'Real life 8', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417768/1_5100426161108813621_o777ix.mp4', TRUE, 8),
  ({CAT_ID_ZA_KIZUNGU}, 'Dudu washa akitatua na kuichana kuma ya kizungu', 'Real life 9', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824280/1_5102637644064491428_gr2fxx.mp4', TRUE, 9),
  ({CAT_ID_ZA_KIZUNGU}, 'Mkundu msafi mweupee akikatikia mboo', 'Real life 10', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824280/1_5093890303216060139_ctwzu9.mp4', TRUE, 10);

-- Za Kibongo videos (32 total - inserting first 10 as example)
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ({CAT_ID_ZA_KIBONGO}, 'Mwalimu akimtomba mwanafunzi wake bila huruma mpaka akamkojoza', 'Music content 1', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417778/4_5828081496082095191_xuu2ar.mp4', TRUE, 1),
  ({CAT_ID_ZA_KIBONGO}, 'Babu akimpa raha mjukuu wake lazima ukojoe', 'Music content 2', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291061/4_6037301744050902288_lrucsw.mp4', TRUE, 2),
  ({CAT_ID_ZA_KIBONGO}, 'Jamaa amepewa kuma ameshindwa kudinda', 'Music content 3', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417761/4_5825743294411314726_imtvkg.mp4', TRUE, 3),
  ({CAT_ID_ZA_KIBONGO}, 'jamaa akimtomba shemeji yake mpaka akakojoa', 'Music content 4', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330113/4_5773962941057472867_yg01om.mp4', TRUE, 4),
  ({CAT_ID_ZA_KIBONGO}, 'Amesema mume wake ana kibamia hamridhishi amekuja geto nimkune', 'Music content 5', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330126/4_5814315279789861040_zrjyas.mp4', TRUE, 5),
  ({CAT_ID_ZA_KIBONGO}, 'jamaa akimtomba BFF wae vichakani mpaka akamwaga bao tamu', 'Music content 6', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330134/1_5078076864992380419_exnx95.mp4', TRUE, 6),
  ({CAT_ID_ZA_KIBONGO}, 'Dada yake ametoka chuo ana nyege jamaa akaamua amkune', 'Music content 7', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330143/4_5825746146269600578_aher2j.mp4', TRUE, 7),
  ({CAT_ID_ZA_KIBONGO}, 'utamu wa hii style demu awe na Tako', 'Music content 8', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773418227/4_5841366843540901968_rldlvh.mp4', TRUE, 8),
  ({CAT_ID_ZA_KIBONGO}, 'Doggystyle', 'Music content 9', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417755/4_5823364131637435113_mgyvn9.mp4', TRUE, 9),
  ({CAT_ID_ZA_KIBONGO}, 'Tomba huku unachezea kisimi lazima akojoe', 'Music content 10', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417753/4_5805584002119113395_tqwlvo.mp4', TRUE, 10);

-- Muvi za kikubwa (Feature films - 12 total)
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ({CAT_ID_MUVI}, 'The Last Border', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 1),
  ({CAT_ID_MUVI}, 'Echoes of Tomorrow', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 2),
  ({CAT_ID_MUVI}, 'Broken Compass', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 3),
  ({CAT_ID_MUVI}, 'Shadows of the Past', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 4),
  ({CAT_ID_MUVI}, 'Journey''s End', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 5),
  ({CAT_ID_MUVI}, 'Silent Witness', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 6),
  ({CAT_ID_MUVI}, 'Heart of Darkness', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 7),
  ({CAT_ID_MUVI}, 'Lost in Time', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 8),
  ({CAT_ID_MUVI}, 'Redemption Arc', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 9),
  ({CAT_ID_MUVI}, 'Untold Stories', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 10),
  ({CAT_ID_MUVI}, 'The Truth Unveiled', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 11),
  ({CAT_ID_MUVI}, 'Final Reckoning', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 12);

-- Connections videos (Premium - 54 total - inserting first 10 as example)
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ({CAT_ID_CONNECTIONS}, 'Dogo wa south alivomtomba mwalimu wake', 'Premium exclusive 1', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825033/4_5904757988144455553_misluy.mp4', TRUE, 1),
  ({CAT_ID_CONNECTIONS}, 'Mwanafunzi wa chuo kenya akigongwa na sponsor wake', 'Premium exclusive 2', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825067/4_5902386801124843653_apvavs.mp4', TRUE, 2),
  ({CAT_ID_CONNECTIONS}, 'P1 Bartazar Engonga akimzagamua secretary wake ofisini', 'Premium exclusive 3', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825889/4_5958501506624788545_zwkezm.mp4', TRUE, 3),
  ({CAT_ID_CONNECTIONS}, 'P2: Bartazar', 'Premium exclusive 4', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291049/4_5961052356421360088_snooxa.mp4', TRUE, 4),
  ({CAT_ID_CONNECTIONS}, 'P3: Bartazar', 'Premium exclusive 5', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291041/4_5960631415266613003_cruaof.mp4', TRUE, 5),
  ({CAT_ID_CONNECTIONS}, 'P4: Bartazar', 'Premium exclusive 6', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291045/4_5960609828760982719_vdls6y.mp4', TRUE, 6),
  ({CAT_ID_CONNECTIONS}, 'Part 1: Boss alivomtomba housegirl wake mpaka akakojoa', 'Premium exclusive 7', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290973/4_5906517524576474634_g5oaep.mp4', TRUE, 7),
  ({CAT_ID_CONNECTIONS}, 'Part 2: Boss alivomtomba housegirl wake mpaka akakojoa', 'Premium exclusive 8', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290972/4_5906771614841705966_fynwgw.mp4', TRUE, 8),
  ({CAT_ID_CONNECTIONS}, 'Wanafunzi wa Bweni walivomtomba malaya mpaka akaishiwa nguvu', 'Premium exclusive 9', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1774262310/1_5125572176719644784_gtbwyn.mp4', TRUE, 9),
  ({CAT_ID_CONNECTIONS}, 'Part 1: Mtoto wa mchungaji akiwa kanisani', 'Premium exclusive 10', 'https://via.placeholder.com/300x200?text=Connections', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290940/4_5843493221719612243_j040y1.mp4', TRUE, 10);

-- Vibao Kata Uchi videos (Premium 2 - 12 videos)
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ({CAT_ID_VIBAO}, 'Premium 2: Raw Footage', 'Ultra premium content 1', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 1),
  ({CAT_ID_VIBAO}, 'Premium 2: Unreleased Cuts', 'Ultra premium content 2', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 2),
  ({CAT_ID_VIBAO}, 'Premium 2: VIP Access', 'Ultra premium content 3', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 3),
  ({CAT_ID_VIBAO}, 'Premium 2: Exclusive Footage', 'Ultra premium content 4', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 4),
  ({CAT_ID_VIBAO}, 'Premium 2: Private Sessions', 'Ultra premium content 5', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 5),
  ({CAT_ID_VIBAO}, 'Premium 2: Secret Content', 'Ultra premium content 6', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 6),
  ({CAT_ID_VIBAO}, 'Premium 2: Member Only', 'Ultra premium content 7', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 7),
  ({CAT_ID_VIBAO}, 'Premium 2: Insider Only', 'Ultra premium content 8', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 8),
  ({CAT_ID_VIBAO}, 'Premium 2: Exclusive Series', 'Ultra premium content 9', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 9),
  ({CAT_ID_VIBAO}, 'Premium 2: Rare Collection', 'Ultra premium content 10', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 10),
  ({CAT_ID_VIBAO}, 'Premium 2: Lost Archive', 'Ultra premium content 11', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 11),
  ({CAT_ID_VIBAO}, 'Premium 2: Ultimate Collection', 'Ultra premium content 12', 'https://via.placeholder.com/300x200?text=Vibao+Kata+Uchi', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 12);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify data was inserted)
-- ============================================================================

-- Check all categories
SELECT id, name, is_premium, sort_order FROM categories ORDER BY sort_order;

-- Check video counts per category
SELECT c.name, COUNT(v.id) as video_count 
FROM categories c 
LEFT JOIN videos v ON c.id = v.category_id 
GROUP BY c.id, c.name;

-- Check all videos with category names
SELECT v.id, v.title, c.name as category, c.is_premium 
FROM videos v 
JOIN categories c ON v.category_id = c.id 
ORDER BY c.sort_order, v.sort_order;
