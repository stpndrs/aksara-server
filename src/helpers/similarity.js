/**
 * Menghitung skor berdasarkan persentase karakter yang cocok.
 * @param {string} stringA Teks asli (kunci jawaban).
 * @param {string} stringB Teks yang akan dibandingkan (hasil transkripsi).
 * @returns {number} Skor dari 0 hingga 100.
 */
exports.calculateCharacterMatchScore = (stringA, stringB) => {
    if (!stringA || !stringB) return 0;

    // 1. Normalisasi: Hapus spasi berlebih dan ubah ke huruf kecil.
    // Tanda baca mungkin penting di sini, jadi kita tidak hapus.
    const a = stringA.toLowerCase().trim();
    const b = stringB.toLowerCase().trim();

    const longerLength = Math.max(a.length, b.length);
    if (longerLength === 0) return 100;

    let correctChars = 0;
    // 2. Bandingkan karakter satu per satu
    for (let i = 0; i < longerLength; i++) {
        // Jika karakter di posisi yang sama cocok, atau jika salah satu string sudah habis
        // (menghitung spasi sebagai "benar" jika jawaban lebih pendek/panjang)
        if (a[i] === b[i]) {
            correctChars++;
        }
    }

    // 3. Hitung persentase karakter yang benar
    const score = (correctChars / longerLength) * 100;
    return score;
};