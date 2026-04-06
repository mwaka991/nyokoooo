-- ============================================================================
-- SUPABASE SQL COMMANDS - FIXED VERSION (NO PLACEHOLDERS NEEDED)
-- ============================================================================
-- Run these commands in order in Supabase SQL Editor: supabase.com → Project → SQL Editor
-- NO NEED TO REPLACE ANYTHING - JUST COPY & PASTE & RUN!

-- ============================================================================
-- STEP 1: CLEAR EXISTING DATA (Optional - only if updating)
-- ============================================================================
DELETE FROM videos;
DELETE FROM categories;

-- ============================================================================
-- STEP 2: INSERT CATEGORIES
-- ============================================================================
INSERT INTO categories (name, slug, is_premium, is_active, sort_order) VALUES
  ('Za moto', 'za-moto', FALSE, TRUE, 1),
  ('Za Kizungu', 'za-kizungu', FALSE, TRUE, 2),
  ('Za Kibongo', 'za-kibongo', FALSE, TRUE, 3),
  ('Muvi za kikubwa', 'muvi-za-kikubwa', FALSE, TRUE, 4),
  ('Connections', 'connections', TRUE, TRUE, 5),
  ('Vibao Kata Uchi', 'vibao-kata-uchi', TRUE, TRUE, 6);

-- ============================================================================
-- STEP 3: INSERT VIDEOS FOR Za moto (12 videos)
-- ============================================================================
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'Part 1: Demu wa chuo Mwaka wa pili kenya akiwa geto na msela', 'Beauty content part 1', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290988/4_5919986924268820430_csfoiv.mp4', TRUE, 1),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'Part 2: Dudu washa tamu likimpa raha mrembo', 'Beauty content part 2', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290989/4_5920084170918336561_czurwm.mp4', TRUE, 2),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'Part 3: Hii style tamu lazima ukojoe', 'Beauty content part 3', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291002/4_5929098104681798158_qjoelp.mp4', TRUE, 3),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'Part 4: Ukipewa kuma hakikisha unaisugua vizuri mpaka mchumba akojoe', 'Beauty content part 4', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290982/4_5920229177604184598_gotv8c.mp4', TRUE, 4),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'Part 5: Pisi imetombwa mpaka ikaomba poo', 'Beauty content part 5', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291014/4_5922708301446912231_pt5tvl.mp4', TRUE, 5),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'P1: Dada anajua kucheza na Dudu kubwa tamu', 'Beauty content P1', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291023/4_5953879438914493546_a02m7b.mp4', TRUE, 6),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'P2: Dudu washa likimkuna vizuri mpaka akafika kileleni', 'Beauty content P2', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291029/4_5954243171104856489_zbvzqs.mp4', TRUE, 7),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'P1: Mrembo anajua namna ya kucheza na mboo', 'Beauty content P1', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290966/4_5902030739746068875_fluekk.mp4', TRUE, 8),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'P2: Kitombo safi kwenye gari', 'Beauty content P2', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290975/4_5904551911318623603_wb1kex.mp4', TRUE, 9),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'Asubuhi haipiti bila kumpa haki yake mke wangu', 'Beauty content', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290955/4_5870712753051670788_vhbs3c.mp4', TRUE, 10),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'Mke wangu anapenda sana Mboo yangu kila asubuhi lazima nimkune', 'Beauty content', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290954/4_5870504837979838456_luqsq5.mp4', TRUE, 11),
  ((SELECT id FROM categories WHERE name = 'Za moto' LIMIT 1), 'Boyfrend wake yupo bize na kazi amekuja geto nimkune vizuri', 'Beauty content', 'https://via.placeholder.com/300x200?text=Za+moto', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290990/4_5920253710457378270_ya99gz.mp4', TRUE, 12);

-- ============================================================================
-- STEP 4: INSERT VIDEOS FOR Za Kizungu (32 videos)
-- ============================================================================
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Wanawake hawataki huruma wanataka kutombwa kweli kweli', 'Real life 1', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773329244/4_5821134227567022482_hdhgfb.mp4', TRUE, 1),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Bibi akikunwa vizuri na mjukuu wa rafiki yake', 'Real life 2', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330118/4_5780921526811368043_eaulvj.mp4', TRUE, 2),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Demu ametombwa vizuri mpaka amekojoa', 'Real life 3', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417768/1_5100426161108813621_o777ix.mp4', TRUE, 3),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Binamu kautaka', 'Real life 4', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417749/4_5803278553868931253_f1bznn.mp4', TRUE, 4),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Mtombaji wa kweli hachagui eneo', 'Real life 5', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417869/4_5834522649945971720_aitecr.mp4', TRUE, 5),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Housegirl ameamka na nyege ikabidi Boss ampe dudu washa', 'Real life 6', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773418614/4_5841478431086224284_eavojh.mp4', TRUE, 6),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Demu aki enjoy utamu na Boyfrend wake', 'Real life 7', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417779/4_5830036273137457188_vqpiwu.mp4', TRUE, 7),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Demu akilamba lolo kwa ufundi kisha akatombwa mpaka akarusha maji ya utamu', 'Real life 8', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417768/1_5100426161108813621_o777ix.mp4', TRUE, 8),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Dudu washa akitatua na kuichana kuma ya kizungu', 'Real life 9', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824280/1_5102637644064491428_gr2fxx.mp4', TRUE, 9),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Mkundu msafi mweupee akikatikia mboo', 'Real life 10', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824280/1_5093890303216060139_ctwzu9.mp4', TRUE, 10),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'demu wa miaka 20 akipigwa mtungo na mboo kubwa', 'Real life 11', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824299/1_4909248894656841284_lilwl6.mp4', TRUE, 11),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'mzungu akila kuma ya kiswahili', 'Real life 12', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824282/1_4994930099187878057_vdzi7u.mp4', TRUE, 12),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Demu akitombwa na mbwa na kunyonya mboo ya mbwa', 'Real life 13', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824296/4_5767011377575102010_samujf.mp4', TRUE, 13),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Jamaa akimla shemeji yake baada ya mke wake kulala', 'Real life 14', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824283/1_5116310633796599885_piccpm.mp4', TRUE, 14),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Dada akikalia mboo kubwa tamu ya boss wake', 'Real life 15', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824803/4_6001091969994987864_hdbsbx.mp4', TRUE, 15),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Blowjob tamu na big tits', 'Real life 16', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824810/4_6014886846603991920_f5r1ig.mp4', TRUE, 16),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Tako kubwa tamu akijikuna kwenye Dudu washa', 'Real life 17', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825035/4_5924612346348574696_g2yjyt.mp4', TRUE, 17),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'mzungu alimlipa ngosha amkune mke wake na dudu washa kubwa', 'Real life 18', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825819/4_6019470805069465396_xc7jqx.mp4', TRUE, 18),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Ukiwa na mboo kubwa hii ndo zawadi nakupa uno feni mpaka umwage ubongo', 'Real life 19', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825879/4_5963224055094979882_zxit1t.mp4', TRUE, 19),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Demu fundi anajua kulamba lolo ipasayo', 'Real life 20', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824280/4_5771630378678749006_f0g9tt.mp4', TRUE, 20),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Huu utamu ni hatari', 'Real life 21', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290949/4_5861811965906655649_m85p2j.mp4', TRUE, 21),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Mrembo anajua kucheza na mboo', 'Real life 22', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291063/4_6034997872053720461_ejxqpf.mp4', TRUE, 22),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'chudai', 'Real life 23', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291046/4_5974506917001697687_glvfjl.mp4', TRUE, 23),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Hii ndo style kuna nazi', 'Real life 24', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291045/4_5989906900198627380_tbnybm.mp4', TRUE, 24),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'P1; Mshangazi unataka shoo za kibabe tu', 'Real life 25', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290981/4_5915513054405071716_bomtvc.mp4', TRUE, 25),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'P2: mshangazi ukishonwa mpaka ukakojoa', 'Real life 26', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290977/4_5915681679116081192_dcymhu.mp4', TRUE, 26),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Jamaa anajua kucheza na kisimi vizuri', 'Real life 27', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290964/4_5884306414737824068_zt5o3a.mp4', TRUE, 27),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Hii nayo nini jamani', 'Real life 28', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290950/4_5848433885808956911_fphlq6.mp4', TRUE, 28),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Utamu wa kutomba uutane na kuma mnato', 'Real life 29', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290945/4_5848184743346051272_ciyf9l.mp4', TRUE, 29),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Bishoo akijilia tunda kimya kimya', 'Real life 30', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290937/4_5812000636014696221_vwke4q.mp4', TRUE, 30),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Mchumba akikalia mboo', 'Real life 31', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290934/4_5841472684419979936_zauodn.mp4', TRUE, 31),
  ((SELECT id FROM categories WHERE name = 'Za Kizungu' LIMIT 1), 'Jamaa kavujisha video za utamu na demu wake', 'Real life 32', 'https://via.placeholder.com/300x200?text=Za+Kizungu', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774290927/4_5825640013332748724_ay0tqa.mp4', TRUE, 32);

-- ============================================================================
-- STEP 5: INSERT VIDEOS FOR Za Kibongo (32 videos)
-- ============================================================================
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Mwalimu akimtomba mwanafunzi wake bila huruma mpaka akamkojoza', 'Music content 1', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417778/4_5828081496082095191_xuu2ar.mp4', TRUE, 1),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Babu akimpa raha mjukuu wake lazima ukojoe', 'Music content 2', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dwoyz0pr0/video/upload/v1774291061/4_6037301744050902288_lrucsw.mp4', TRUE, 2),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Jamaa amepewa kuma ameshindwa kudinda', 'Music content 3', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417761/4_5825743294411314726_imtvkg.mp4', TRUE, 3),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'jamaa akimtomba shemeji yake mpaka akakojoa', 'Music content 4', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330113/4_5773962941057472867_yg01om.mp4', TRUE, 4),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Amesema mume wake ana kibamia hamridhishi amekuja geto nimkune', 'Music content 5', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330126/4_5814315279789861040_zrjyas.mp4', TRUE, 5),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'jamaa akimtomba BFF wae vichakani mpaka akamwaga bao tamu', 'Music content 6', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330134/1_5078076864992380419_exnx95.mp4', TRUE, 6),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Dada yake ametoka chuo ana nyege jamaa akaamua amkune', 'Music content 7', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330143/4_5825746146269600578_aher2j.mp4', TRUE, 7),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'utamu wa hii style demu awe na Tako', 'Music content 8', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773418227/4_5841366843540901968_rldlvh.mp4', TRUE, 8),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Doggystyle', 'Music content 9', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417755/4_5823364131637435113_mgyvn9.mp4', TRUE, 9),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Tomba huku unachezea kisimi lazima akojoe', 'Music content 10', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417753/4_5805584002119113395_tqwlvo.mp4', TRUE, 10),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Shangazi amesema mjomba hajui kuomba, nimemkuna usiku mzima', 'Music content 11', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417752/1_5127858967631889577_svkpvv.mp4', TRUE, 11),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Dudu washa linakuna kila kona kwenye Kuma', 'Music content 12', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773417754/4_5814598288069893206_k14gsn.mp4', TRUE, 12),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Never skip low quality video', 'Music content 13', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330114/1_5127697300767901283_mvw9zx.mp4', TRUE, 13),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Nataka mwanaume mmoja anitombe hivi', 'Music content 14', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330116/4_5764657391899515481_xuzulp.mp4', TRUE, 14),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'mwanaume aje nimkatiie hivi mpaka akojoe', 'Music content 15', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330120/4_5801018610797255210_h6zetp.mp4', TRUE, 15),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Shemeji ametombwa mpaka anatetemeka', 'Music content 16', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dixp7ijiu/video/upload/v1773330151/4_5845889040376666542_ihpjko.mp4', TRUE, 16),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'vienyeji wakitombana', 'Music content 17', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825199/4_6001573272620113994_mv6ujh.mp4', TRUE, 17),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'jamaa anatomba mtu na Dada yake', 'Music content 18', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825201/4_5999317834969127316_dulpne.mp4', TRUE, 18),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Ukiwa na mboo kubwa hii ndo zawadi nakupa kipenzi', 'Music content 19', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825426/4_6017231310337088850_yhqwhd.mp4', TRUE, 19),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'mzee wa kanisa akimkojoza mwanakwaya wa sauti ya Kwanza', 'Music content 20', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825844/4_5945273209216572422_hwmpal.mp4', TRUE, 20),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Dogstyle inanoga demu akiwa na tako laini', 'Music content 21', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825953/4_5870950741484513816_vbb667.mp4', TRUE, 21),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Tomba taratibu huku unachezea kisimi lazima amwage uji wa utamu', 'Music content 22', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825956/4_5843740474396909035_uzeca6.mp4', TRUE, 22),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Demu akikatikia mboo ya mtoto wa mwenye nyumba wake', 'Music content 23', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825884/4_5965172024627171204_sgadbu.mp4', TRUE, 23),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Demu akikatikia mboo kubwa ya shemeji yake', 'Music content 24', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825879/4_5963224055094979882_zxit1t.mp4', TRUE, 24),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'pisi kali za kenye zikisagana na kushare utamu', 'Music content 25', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825888/4_5963047793932109125_yyaw2r.mp4', TRUE, 25),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'muuza chipsi akitomba pisi ya chuo bila huruma mpaka akakojoa', 'Music content 26', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825870/4_5953961773437554885_ln6mdp.mp4', TRUE, 26),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'jamaa akimzagamua rafiki wa dada yake wa chuo', 'Music content 27', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825880/4_5958457131022686092_ylko6v.mp4', TRUE, 27),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'pisi kali zikisagana', 'Music content 28', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825188/4_5976739634275688067_xiywo2.mp4', TRUE, 28),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'chuchu konzi akinyonya mboo ya boss wake mzungu mpaka akamwaga shahawa kifuani', 'Music content 29', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773825043/4_5897909095855300034_wwreuh.mp4', TRUE, 29),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Jose akimtomba housegirl wao baadaya wazazi kutoka', 'Music content 30', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824800/4_6026235941201387549_tukptu.mp4', TRUE, 30),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'Hii style tamu mboo inafika mpaka tumboni', 'Music content 31', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824537/4_6024047496450284525_azpnmw.mp4', TRUE, 31),
  ((SELECT id FROM categories WHERE name = 'Za Kibongo' LIMIT 1), 'mtombaji wa kweli hachagui sehemu ya kutombea', 'Music content 32', 'https://via.placeholder.com/300x200?text=Za+Kibongo', 'https://res.cloudinary.com/dhqfbdotw/video/upload/v1773824281/1_4906949021274211915_nyuth6.mp4', TRUE, 32);

-- ============================================================================
-- STEP 6: INSERT VIDEOS FOR Muvi za kikubwa (12 videos)
-- ============================================================================
INSERT INTO videos (category_id, title, description, thumbnail_url, video_url, is_active, sort_order) VALUES
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'The Last Border', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 1),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Echoes of Tomorrow', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 2),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Broken Compass', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 3),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Shadows of the Past', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 4),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Journey''s End', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 5),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Silent Witness', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 6),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Heart of Darkness', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 7),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Lost in Time', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 8),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Redemption Arc', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 9),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Untold Stories', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 10),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'The Truth Unveiled', 'Feature film by Jabali Films', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 11),
  ((SELECT id FROM categories WHERE name = 'Muvi za kikubwa' LIMIT 1), 'Final Reckoning', 'Feature film by Nyota Cinema', 'https://via.placeholder.com/300x200?text=Muvi+za+kikubwa', 'https://www.w3schools.com/html/mov_bbb.mp4', TRUE, 12);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to check data)
-- ============================================================================

-- Check all categories
SELECT id, name, is_premium, sort_order FROM categories ORDER BY sort_order;

-- Check video counts per category
SELECT c.name, COUNT(v.id) as video_count 
FROM categories c 
LEFT JOIN videos v ON c.id = v.category_id 
GROUP BY c.id, c.name
ORDER BY c.sort_order;

-- Check total videos
SELECT COUNT(*) as total_videos FROM videos;
