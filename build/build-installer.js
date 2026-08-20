const inno = require('innosetup-compiler');
const path = require('path');

console.log('📦 Inno Setup ile Windows kurulum paketi oluşturuluyor...');

inno(path.join(__dirname, 'installer.iss'), { gui: false }, function(error) {
    if (error) {
        console.error('❌ Kurulum paketi oluşturulurken hata:', error);
        process.exit(1);
    } else {
        console.log('✅ Kurulum paketi başarıyla oluşturuldu! Çıktı klasörü: dist/');
    }
});
