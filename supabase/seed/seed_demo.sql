-- Combo · Demo seed (PRD §7 M6): ~30 plausible cards across DACH for beta
-- liquidity testing. Demo users cannot log in (random passwords).
--
-- Idempotent: existing demo data is wiped first. Remove demo data for good
-- by running only the delete below.
delete from auth.users where email like 'demo-%@combo-demo.invalid';

-- ---------------------------------------------------------------- users
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token)
select
  ('d0000000-0000-4000-8000-0000000000' || lpad(n::text, 2, '0'))::uuid,
  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'demo-' || lpad(n::text, 2, '0') || '@combo-demo.invalid',
  extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
  now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(),
  '', '', '', '', '', '', '', ''
from generate_series(1, 22) n
on conflict (id) do nothing;

-- ---------------------------------------------------------------- profiles
insert into public.profiles (id, display_name, birth_date, bio, city, lat, lng, onboarding_complete)
values
  ('d0000000-0000-4000-8000-000000000001', 'Mira',      '1996-04-12', 'Filmemacherin mit Faible für Alltagsgeschichten.', 'Zürich',      47.37,  8.54, true),
  ('d0000000-0000-4000-8000-000000000002', 'Jonas',     '1989-11-03', 'Bassist, Tontechnik-Nerd, Bandproberaum vorhanden.', 'Zürich',    47.37,  8.54, true),
  ('d0000000-0000-4000-8000-000000000003', 'Selin',     '2003-07-21', 'Illustration & Zines. Immer Stift dabei.',          'Winterthur',  47.50,  8.72, true),
  ('d0000000-0000-4000-8000-000000000004', 'Res',       '1978-02-14', 'Schreiner, baut alles was wackelt wieder gerade.',  'Luzern',      47.05,  8.31, true),
  ('d0000000-0000-4000-8000-000000000005', 'Leonie',    '1999-09-30', 'Fotografie (analog!), Dunkelkammer im Keller.',     'Basel',       47.56,  7.59, true),
  ('d0000000-0000-4000-8000-000000000006', 'Samuel',    '1985-06-08', 'Projektleiter im Beruf, Vereinsmensch im Herzen.',  'Bern',        46.95,  7.44, true),
  ('d0000000-0000-4000-8000-000000000007', 'Ayla',      '2005-01-17', 'Tanze seit ich denken kann. Suche Bühne.',          'St. Gallen',  47.42,  9.38, true),
  ('d0000000-0000-4000-8000-000000000008', 'Beat',      '1968-12-02', '30 Jahre Kulturveranstaltungen organisiert.',       'Zürich',      47.37,  8.54, true),
  ('d0000000-0000-4000-8000-000000000009', 'Franzi',    '1994-05-25', 'Game-Design-Studium abgebrochen, Leidenschaft geblieben.', 'Konstanz', 47.66, 9.18, true),
  ('d0000000-0000-4000-8000-000000000010', 'Tobi',      '1991-08-19', 'Podcasts, Radio, alles mit Mikrofon.',              'Freiburg',    47.99,  7.85, true),
  ('d0000000-0000-4000-8000-000000000011', 'Charlotte', '1982-03-06', 'Stadtgärtnerin aus Überzeugung.',                   'München',     48.14, 11.58, true),
  ('d0000000-0000-4000-8000-000000000012', 'Ole',       '1997-10-11', 'Siebdruck, Plakate, DIY-Kultur.',                   'Berlin',      52.52, 13.40, true),
  ('d0000000-0000-4000-8000-000000000013', 'Nina',      '2001-06-29', 'Improtheater und alles was spontan ist.',           'Wien',        48.21, 16.37, true),
  ('d0000000-0000-4000-8000-000000000014', 'Ferdl',     '1973-09-14', 'Musiklehrer, Chorleiter, Notenarchivar.',           'Graz',        47.07, 15.44, true),
  ('d0000000-0000-4000-8000-000000000015', 'Käthi',     '1959-04-02', 'Pensionierte Journalistin, hilft gern beim Texten.', 'Zürich',     47.37,  8.54, true),
  ('d0000000-0000-4000-8000-000000000016', 'Dario',     '2004-11-23', 'Schneide Videos schneller als mein Schatten.',      'Bern',        46.95,  7.44, true),
  -- Basel-Cluster (Region Nordwestschweiz / Dreiland)
  ('d0000000-0000-4000-8000-000000000017', 'Priya',     '1993-02-27', 'Grafikdesignerin, verliebt in Raster und Papier.',  'Basel',       47.56,  7.59, true),
  ('d0000000-0000-4000-8000-000000000018', 'Marco',     '1987-07-15', 'Velomech mit Werkstattzugang und Geduld.',          'Liestal',     47.48,  7.73, true),
  ('d0000000-0000-4000-8000-000000000019', 'Heidi',     '1962-10-05', 'Lange im Stiftungswesen gearbeitet, jetzt Zeit für Herzensprojekte.', 'Basel', 47.56, 7.59, true),
  ('d0000000-0000-4000-8000-000000000020', 'Luc',       '2002-12-18', 'Beats, Synths, Feldaufnahmen vom Rheinufer.',       'Lörrach',     47.61,  7.66, true),
  ('d0000000-0000-4000-8000-000000000021', 'Aline',     '1998-05-09', 'Schreibe gern über Orte und Menschen.',             'Aarau',       47.39,  8.05, true),
  ('d0000000-0000-4000-8000-000000000022', 'Stefan',    '1975-03-31', 'Kleinbasler, organisiert gern draussen.',           'Basel',       47.56,  7.59, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------- cards
insert into public.cards (owner_id, type, title, description, city, lat, lng, radius_km, show_collaborators, show_mentors)
values
  -- Projekte (14)
  ('d0000000-0000-4000-8000-000000000001', 'project', 'Kurzfilm: Nachtschicht am Kiosk', 'Doku-Kurzfilm über Menschen, die nachts arbeiten. Konzept steht, Kamera vorhanden. Gesucht: Ton, Schnitt und jemand fürs Licht. Dreh an 4 Wochenenden.', 'Zürich', 47.37, 8.54, 50, true, true),
  ('d0000000-0000-4000-8000-000000000002', 'project', 'Indie-Band sucht Drummer:in', 'Wir sind Bass + Gitarre + Gesang, Richtung Garage/Indie. Proberaum in Altstetten, 1x pro Woche. Ziel: 5 eigene Songs und ein erster Gig.', 'Zürich', 47.37, 8.54, 30, true, false),
  ('d0000000-0000-4000-8000-000000000003', 'project', 'Zine über Winterthurer Hinterhöfe', 'Ein fotografisch-illustriertes Heft über versteckte Orte. Ich zeichne, du fotografierst oder schreibst? Auflage 100, Risodruck.', 'Winterthur', 47.50, 8.72, 40, true, true),
  ('d0000000-0000-4000-8000-000000000004', 'project', 'Repair-Café im Quartier aufbauen', 'Monatlicher Reparatur-Treff: Velos, Toaster, Hosen. Ich bringe Werkstatt und Werkzeug mit, gesucht sind 3-4 Mitstreiter:innen und jemand mit Vereinserfahrung.', 'Luzern', 47.05, 8.31, 60, true, true),
  ('d0000000-0000-4000-8000-000000000005', 'project', 'Analoge Fotoausstellung im Treppenhaus', 'Pop-up-Ausstellung in einem Basler Treppenhaus, Thema «Nachbarschaft». Suche 3 Fotograf:innen und Hilfe beim Hängen und Vernissage-Apéro.', 'Basel', 47.56, 7.59, 50, true, true),
  ('d0000000-0000-4000-8000-000000000006', 'project', 'Quartierfest Breitenrain 2027', 'Kleines, feines Strassenfest: Bühne, Essstände, Kinderecke. OK-Team sucht Verstärkung für Programm und Logistik. Erfahrung egal, Zuverlässigkeit zählt.', 'Bern', 46.95, 7.44, 40, true, true),
  ('d0000000-0000-4000-8000-000000000007', 'project', 'Tanz-Performance im öffentlichen Raum', 'Contemporary-Stück an drei Plätzen in der Innenstadt. Suche 4 Tänzer:innen (alle Levels) und jemanden für Sound. Proben ab September.', 'St. Gallen', 47.42, 9.38, 80, true, true),
  ('d0000000-0000-4000-8000-000000000009', 'project', 'Cozy Game über den Bodensee', 'Kleines Pixel-Art-Spiel: Fähre fahren, Leute treffen, Geschichten sammeln. Godot. Suche Pixel-Artist und jemanden für Musik. Kein Kommerz, nur Liebe.', 'Konstanz', 47.66, 9.18, 100, true, true),
  ('d0000000-0000-4000-8000-000000000010', 'project', 'Podcast: Grenzgänger-Geschichten', 'Interviews mit Menschen, die zwischen DE und CH pendeln. 8 Folgen geplant. Suche Co-Host und Schnitthilfe, Equipment ist da.', 'Freiburg', 47.99, 7.85, 100, true, true),
  ('d0000000-0000-4000-8000-000000000011', 'project', 'Gemeinschaftsgarten auf dem Flachdach', 'Genossenschaft stellt Dach zur Verfügung, jetzt fehlen Hochbeete und Menschen. Frühjahrs-Bauwochenende + wöchentliches Giessen im Team.', 'München', 48.14, 11.58, 50, true, true),
  ('d0000000-0000-4000-8000-000000000012', 'project', 'Siebdruck-Werkstatt-Kollektiv', 'Offene Werkstatt in Neukölln: Plakate, Shirts, Kunst. Suche 2-3 Leute, die Lust haben, Schichten zu übernehmen und die Werkstatt mitzugestalten.', 'Berlin', 52.52, 13.40, 30, true, false),
  ('d0000000-0000-4000-8000-000000000013', 'project', 'Impro-Show: Szenen aus der U-Bahn', 'Monatliche Impro-Show, Setting immer ÖPNV. Wir sind zu dritt, suchen 2 Spieler:innen und eine Person für Licht/Musik-Einspieler.', 'Wien', 48.21, 16.37, 60, true, true),
  ('d0000000-0000-4000-8000-000000000014', 'project', 'Offener Chor für Filmmusik', 'Von Morricone bis Studio Ghibli. Keine Vorkenntnisse nötig, Proben 14-täglich im Gemeindesaal. Konzert im Sommer. Alle Stimmlagen willkommen!', 'Graz', 47.07, 15.44, 50, true, true),
  ('d0000000-0000-4000-8000-000000000008', 'project', 'Lesebühne im Hinterzimmer', 'Monatliche Lesebühne für unveröffentlichte Texte. Lokal ist organisiert, suche Menschen fürs Programm, die Moderation und den Büchertisch.', 'Zürich', 47.37, 8.54, 40, true, true),

  -- Mitmach-Angebote (11)
  ('d0000000-0000-4000-8000-000000000016', 'collab_offer', 'Videoschnitt-Nerd sucht Projekt', 'Premiere und DaVinci, schnelle Turnarounds, Gespür für Rhythmus. Würde gern einen Kurzfilm oder eine Doku schneiden — Hauptsache, die Geschichte stimmt.', 'Bern', 46.95, 7.44, 100, true, true),
  ('d0000000-0000-4000-8000-000000000003', 'collab_offer', 'Illustratorin für euer Projekt', 'Plakate, Cover, Wimmelbilder. Analog und digital. Ich suche ein Projekt mit Herz, gern auch längerfristig.', 'Winterthur', 47.50, 8.72, 60, true, true),
  ('d0000000-0000-4000-8000-000000000005', 'collab_offer', 'Fotografin (analog & digital)', 'Reportage-Stil, viel Erfahrung mit Porträts. Stelle auch gern meine Dunkelkammer zur Verfügung.', 'Basel', 47.56, 7.59, 80, true, true),
  ('d0000000-0000-4000-8000-000000000007', 'collab_offer', 'Tänzerin sucht Performance-Projekt', 'Contemporary, Hip-Hop-Basics, Bühnenerfahrung aus Schulprojekten. Suche ein Stück, bei dem ich richtig mitarbeiten kann.', 'St. Gallen', 47.42, 9.38, 100, true, true),
  ('d0000000-0000-4000-8000-000000000002', 'collab_offer', 'Tontechnik & Mischpult', 'Live-Ton für Konzerte und kleine Festivals, eigenes Pult vorhanden. Biete mich für Events und Bühnenprojekte an.', 'Zürich', 47.37, 8.54, 50, true, true),
  ('d0000000-0000-4000-8000-000000000004', 'collab_offer', 'Handwerker für Bühnen- und Kulissenbau', 'Schreiner mit eigener Werkstatt. Bühnenbilder, Stände, Hochbeete — wenn es aus Holz ist, bin ich dabei.', 'Luzern', 47.05, 8.31, 80, true, true),
  ('d0000000-0000-4000-8000-000000000009', 'collab_offer', 'Godot-Entwicklerin für Game Jams', 'Programmiere seit 5 Jahren hobbymässig Spiele. Suche Team für Jams oder ein kleines gemeinsames Spielprojekt.', 'Konstanz', 47.66, 9.18, 150, true, true),
  ('d0000000-0000-4000-8000-000000000010', 'collab_offer', 'Stimme & Schnitt für euren Podcast', 'Radioerfahrung, ruhige Erzählstimme, ordentliches Home-Studio. Helfe gern bei Konzept, Aufnahme und Postproduktion.', 'Freiburg', 47.99, 7.85, 120, true, true),
  ('d0000000-0000-4000-8000-000000000012', 'collab_offer', 'Social Media für Kulturprojekte', 'Mache Insta/TikTok für zwei Berliner Kollektive. Übernehme gern die Kanäle eures Projekts — Konzept bis Posting.', 'Berlin', 52.52, 13.40, 50, true, true),
  ('d0000000-0000-4000-8000-000000000013', 'collab_offer', 'Schauspielerin für Kurzfilme', 'Impro-Background, keine Angst vor seltsamen Rollen. Zeit an Wochenenden, auch für Reisen innerhalb Österreichs.', 'Wien', 48.21, 16.37, 150, true, true),
  ('d0000000-0000-4000-8000-000000000001', 'collab_offer', 'Kamerafrau mit eigenem Equipment', 'Sony FX3 + Gimbal. Doku-Look ist mein Ding. Suche ein zweites Projekt neben meinem eigenen Kurzfilm.', 'Zürich', 47.37, 8.54, 60, true, true),

  -- Paten-Angebote (5)
  ('d0000000-0000-4000-8000-000000000008', 'mentor_offer', 'Pate für Kulturveranstaltungen', '30 Jahre Konzerte, Lesungen und Festivals organisiert. Begleite euer Projekt mit Rat zu Budget, Bewilligungen und Programm — monatlicher Kaffee statt Mitarbeit.', 'Zürich', 47.37, 8.54, 60, true, true),
  ('d0000000-0000-4000-8000-000000000015', 'mentor_offer', 'Patin für Text und Öffentlichkeitsarbeit', 'Ex-Journalistin. Lese eure Texte gegen, helfe bei Medienmitteilungen und erzähle euch, wie Redaktionen ticken.', 'Zürich', 47.37, 8.54, 80, true, true),
  ('d0000000-0000-4000-8000-000000000006', 'mentor_offer', 'Pate für Vereinsgründung & Organisation', 'Statuten, Versammlungen, Finanzen — habe drei Vereine mitgegründet und begleite gern euer Projekt zu soliden Strukturen.', 'Bern', 46.95, 7.44, 100, true, true),
  ('d0000000-0000-4000-8000-000000000014', 'mentor_offer', 'Pate für Musikprojekte', 'Chorleiter und Musiklehrer. Höre zu, gebe Feedback zu Arrangements und helfe, Proben zu strukturieren. Aktiv mitspielen mag ich nicht mehr — beraten sehr.', 'Graz', 47.07, 15.44, 100, true, true),
  ('d0000000-0000-4000-8000-000000000011', 'mentor_offer', 'Patin für Garten- und Quartierprojekte', 'Stadtgärtnerin. Begleite Gemeinschaftsgärten von der Idee bis zur ersten Ernte: Substrat, Bewässerung, Gruppendynamik.', 'München', 48.14, 11.58, 80, true, true),

  -- Basel-Cluster
  ('d0000000-0000-4000-8000-000000000017', 'collab_offer', 'Grafikerin für Plakate & Flyer', 'InDesign, Illustrator, Siebdruck-Grundkenntnisse. Gestalte gern das Erscheinungsbild eures Projekts — vom Logo bis zum Programmheft.', 'Basel', 47.56, 7.59, 50, true, true),
  ('d0000000-0000-4000-8000-000000000018', 'collab_offer', 'Velomech & Bastler hilft beim Aufbau', 'Ob Lastenvelo-Umbau, Standbau oder Reparatur-Event: Ich bringe Werkzeug, Erfahrung und Kaffee mit.', 'Liestal', 47.48, 7.73, 40, true, true),
  ('d0000000-0000-4000-8000-000000000019', 'mentor_offer', 'Patin für Fundraising & Stiftungen', 'Kenne die Schweizer Stiftungslandschaft gut. Helfe euch, Gesuche zu schreiben und die richtigen Töpfe zu finden — beratend, im Hintergrund.', 'Basel', 47.56, 7.59, 60, true, true),
  ('d0000000-0000-4000-8000-000000000020', 'collab_offer', 'Beatmaker sucht Musik- oder Filmprojekt', 'Produziere elektronische Musik (Ableton) und Sounddesign. Würde gern einen Kurzfilm vertonen oder bei einem Musikprojekt einsteigen.', 'Lörrach', 47.61, 7.66, 60, true, true),
  ('d0000000-0000-4000-8000-000000000021', 'collab_offer', 'Texterin für Zines und Websites', 'Portraits, Reportagen, Mikrotexte. Ich mache aus euren Stichworten Sätze, die man gern liest.', 'Aarau', 47.39, 8.05, 80, true, true),
  ('d0000000-0000-4000-8000-000000000022', 'project', 'Hofkino im Kleinbasel', 'Open-Air-Kino für einen Innenhof: 4 Abende im Spätsommer, Kurzfilme aus der Region. Suche Technik-Hilfe, Kurator:innen und Leute für die Bar.', 'Basel', 47.56, 7.59, 30, true, true)
;
