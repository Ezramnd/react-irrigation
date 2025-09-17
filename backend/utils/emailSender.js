import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
    // 1. Buat transporter (layanan yang akan mengirim email)
    //    Pastikan kredensial diambil dari process.env
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Opsi tambahan untuk mengatasi beberapa masalah koneksi
        tls: {
            rejectUnauthorized: false
        }
    });

    // 2. Definisikan opsi email
    const mailOptions = {
        from: `Agrifam Indonesia <${process.env.EMAIL_USER}>`, // Alamat pengirim
        to: options.email,       // Alamat penerima
        subject: options.subject,  // Subjek email
        text: options.message    // Isi pesan
    };

    // 3. Kirim email dan tangani error
    try {
        await transporter.sendMail(mailOptions);
        console.log('✅ Email berhasil dikirim!');
    } catch (error) {
        // Log error yang detail ke konsol backend
        console.error('❌ Gagal mengirim email:', error);
        // Anda bisa throw error di sini jika ingin menanganinya di controller
        // throw new Error('Gagal mengirim email, coba lagi nanti.');
    }
};