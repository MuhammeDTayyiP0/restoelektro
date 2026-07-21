import sqlite3
import random
from datetime import datetime, timedelta

DB_PATH = r"C:\Users\mtede\AppData\Roaming\etibol-resto\data\restoelektro.db"

def seed():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    
    # Get products
    cur.execute("SELECT id, fiyat FROM urun")
    urunler = cur.fetchall()
    
    if not urunler:
        print("Urun bulunamadi, seed islemi iptal edildi.")
        return
        
    # Get personnel
    cur.execute("SELECT id FROM personel")
    personel_list = [p[0] for p in cur.fetchall()]
    if not personel_list:
        personel_list = [1]
        
    # Get tables
    cur.execute("SELECT id FROM masa")
    masa_list = [m[0] for m in cur.fetchall()]
    if not masa_list:
        masa_list = [1, 2, 3]

    print("Veri olusturuluyor...")
    
    # Delete old fake data if needed? We will just add new.
    # Actually, better to just append.
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)
    
    hesap_count = 0
    
    current_date = start_date
    while current_date <= end_date:
        # Generate 15 to 45 orders per day
        num_orders = random.randint(15, 45)
        
        for i in range(num_orders):
            hesap_count += 1
            
            # Random time between 10:00 and 23:00
            hour = random.randint(10, 22)
            minute = random.randint(0, 59)
            
            acilis_zamani = current_date.replace(hour=hour, minute=minute, second=0, microsecond=0)
            
            # Stay time: 20 to 120 mins
            stay_mins = random.randint(20, 120)
            kapanis_zamani = acilis_zamani + timedelta(minutes=stay_mins)
            
            masa_id = random.choice(masa_list)
            personel_id = random.choice(personel_list)
            hesap_no = f"HSP-{acilis_zamani.strftime('%Y%m%d')}-{random.randint(1000,9999)}{hesap_count}"
            
            cur.execute("""
                INSERT INTO hesap (masa_id, hesap_no, hesap_tipi, personel_id, durum, acilis_zamani, kapanis_zamani, kisi_sayisi)
                VALUES (?, ?, 'masa', ?, 'odendi', ?, ?, ?)
            """, (masa_id, hesap_no, personel_id, acilis_zamani.strftime("%Y-%m-%d %H:%M:%S"), kapanis_zamani.strftime("%Y-%m-%d %H:%M:%S"), random.randint(1,4)))
            
            hesap_id = cur.lastrowid
            
            toplam_tutar = 0
            
            # Generate 2 to 6 items per order
            num_items = random.randint(2, 6)
            for _ in range(num_items):
                urun_id, fiyat = random.choice(urunler)
                miktar = random.randint(1, 3)
                birim_fiyat = fiyat
                s_toplam = miktar * birim_fiyat
                toplam_tutar += s_toplam
                
                siparis_zamani = acilis_zamani + timedelta(minutes=random.randint(2, stay_mins - 5))
                
                cur.execute("""
                    INSERT INTO siparis (hesap_id, urun_id, miktar, birim_fiyat, toplam_fiyat, durum, siparis_zamani, personel_id)
                    VALUES (?, ?, ?, ?, ?, 'teslim_edildi', ?, ?)
                """, (hesap_id, urun_id, miktar, birim_fiyat, s_toplam, siparis_zamani.strftime("%Y-%m-%d %H:%M:%S"), personel_id))
            
            # Update order total
            cur.execute("""
                UPDATE hesap SET toplam_tutar = ?, net_tutar = ? WHERE id = ?
            """, (toplam_tutar, toplam_tutar, hesap_id))
            
            # Create payment
            odeme_tipi = random.choice(['kredi_karti', 'kredi_karti', 'nakit']) # 66% card
            cur.execute("""
                INSERT INTO odeme (hesap_id, odeme_tipi, tutar, odeme_zamani, personel_id)
                VALUES (?, ?, ?, ?, ?)
            """, (hesap_id, odeme_tipi, toplam_tutar, kapanis_zamani.strftime("%Y-%m-%d %H:%M:%S"), personel_id))
            
        current_date += timedelta(days=1)
        
    conn.commit()
    conn.close()
    print(f"Basariyla {hesap_count} adet hesap ve siparisleri olusturuldu.")

if __name__ == '__main__':
    seed()
