/**
 * ==========================================================================
 * EMAIL SUMMARIZER HEURISTIC NLP ENGINE (emailSummarizer.js)
 * Analyzes email raw content and extracts summary, priority, and action items.
 * ==========================================================================
 */

const EmailSummarizer = {
    summarize: function(rawEmail) {
        if (!rawEmail || typeof rawEmail !== 'string') {
            return {
                subject: 'ไม่มีหัวข้อ',
                sender: 'ไม่ระบุผู้ส่ง',
                priority: 'normal',
                summaryText: 'ไม่พบเนื้อหาอีเมล',
                actionItems: []
            };
        }

        const lines = rawEmail.split('\n').map(l => l.trim()).filter(Boolean);
        let subject = 'สรุปข้อความอีเมล';
        let sender = 'ระบบรับส่งอีเมล';

        lines.forEach(line => {
            if (/^(subject|เรื่อง|หัวข้อ):/i.test(line)) {
                subject = line.replace(/^(subject|เรื่อง|หัวข้อ):/i, '').trim();
            }
            if (/^(from|จาก|ผู้ส่ง):/i.test(line)) {
                sender = line.replace(/^(from|จาก|ผู้ส่ง):/i, '').trim();
            }
        });

        const isUrgent = /ด่วน|urgent| asap |ทันที|สำคัญมาก/i.test(rawEmail);
        const priority = isUrgent ? 'urgent' : 'normal';

        const actionItems = [];
        lines.forEach(line => {
            if (/โปรด|กรุณา|ต้อง|รบกวน|ส่ง|ชำระ|อนุมัติ|ตรวจ/i.test(line) && line.length < 120) {
                actionItems.push(line);
            }
        });

        if (actionItems.length === 0) {
            actionItems.push('ตรวจสอบรายละเอียดเนื้อหาอีเมลฉบับเต็มเพิ่มเติม');
        }

        return {
            subject: subject,
            sender: sender,
            priority: priority,
            summaryText: lines.slice(0, 4).join(' '),
            actionItems: actionItems.slice(0, 3)
        };
    }
};

if (typeof module !== 'undefined') {
    module.exports = EmailSummarizer;
}
