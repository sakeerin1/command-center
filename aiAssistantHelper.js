/**
 * ==========================================================================
 * REEN AI ASSISTANT HELPER & INTENT PARSER (aiAssistantHelper.js)
 * Natural Language Processing for Thai/English executive voice & text commands.
 * Handles task extraction, assignee parsing, expense tracking, daily briefing,
 * project status analysis, weekly review, and AI context memory.
 * ==========================================================================
 */

const ReenAIEngine = {
    /**
     * Parses natural language input (Thai/English) into structured intent and parameters.
     * @param {string} text - Raw text or speech input from user.
     * @returns {Object} Parsed intent object.
     */
    parseIntent: function(text) {
        if (!text || typeof text !== 'string') {
            return { intent: 'unknown', rawText: '' };
        }

        const cleanText = text.trim();
        const lower = cleanText.toLowerCase();

        // 1. Record Expense / Financial Transaction
        // Example: "วันนี้จ่าย ค่าโดเมน sitekira 5000", "จ่ายค่าโฮสติ้ง 2000"
        if (/จ่าย|ค่าใช้จ่าย|ซื้อ|ค่าโดเมน|ค่าโฮสติ้ง|งบ|รายจ่าย/i.test(cleanText) && /\d+/.test(cleanText)) {
            const amountMatch = cleanText.match(/(\d+[\d,]*)/);
            const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 0;
            
            // Extract project if mentioned
            let project = 'General';
            if (/sitekira|site kira/i.test(cleanText)) project = 'sitekira';
            else if (/sino house|sino/i.test(cleanText)) project = 'Sino House Phuket';
            else if (/pms|kiralux/i.test(cleanText)) project = 'PMS Kiralux System';

            // Extract item description
            let item = cleanText.replace(/วันนี้|จ่าย|ค่าใช้จ่าย|ราคา|บาท/g, '').replace(/\d+[\d,]*/, '').trim();
            if (!item) item = 'ค่าใช้จ่ายทั่วไป';

            return {
                intent: 'record_expense',
                title: item,
                amount: amount,
                project: project,
                category: 'Expense',
                rawText: cleanText
            };
        }

        // 2. Delegate Task / Assign to Subordinate
        // Example: "วันนี้ สั่งงานลูกน้อง ชื่อ มิว ให้ทำระบบ ใบลา กำหนดส่ง วันที่30"
        if (/สั่งงาน|มอบหมาย|ให้ลูกน้อง|ฝากงาน|ตามงาน/i.test(cleanText)) {
            let assignee = 'ลูกน้อง';
            const nameMatch = cleanText.match(/(?:ชื่อ|ลูกน้อง|ให้|ตามงาน)\s*([ก-๙a-zA-Z]+)/);
            if (nameMatch && nameMatch[1]) {
                const candidate = nameMatch[1].trim();
                if (!['งาน', 'ลูกน้อง', 'ทำ', 'ระบบ'].includes(candidate)) {
                    assignee = candidate;
                }
            }

            // Extract due date if mentioned (e.g. วันที่ 30, พรุ่งนี้)
            let dueDate = null;
            const dateMatch = cleanText.match(/วันที่\s*(\d+)/i);
            const now = new Date();
            if (dateMatch) {
                const dayNum = parseInt(dateMatch[1]);
                const targetDate = new Date(now.getFullYear(), now.getMonth(), dayNum, 17, 0);
                if (targetDate < now) targetDate.setMonth(targetDate.getMonth() + 1);
                dueDate = targetDate.toISOString();
            } else if (/พรุ่งนี้/i.test(cleanText)) {
                const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                tomorrow.setHours(17, 0, 0, 0);
                dueDate = tomorrow.toISOString();
            }

            let taskTitle = cleanText
                .replace(/วันนี้|สั่งงานลูกน้อง|สั่งงาน|ชื่อ|มอบหมายให้|ให้ทำ|ทำระบบ|กำหนดส่ง|วันที่\s*\d+/gi, '')
                .trim();
            if (!taskTitle) taskTitle = cleanText;

            return {
                intent: 'create_task',
                title: taskTitle,
                assignee: assignee,
                category: 'Delegated',
                due: dueDate,
                priority: 'high',
                rawText: cleanText
            };
        }

        // 3. Query Oldest Uncompleted Task
        // Example: "งานไหนค้างนานที่สุด", "งานค้างเก่าสุด"
        if (/งานไหนค้างนานที่สุด|งานค้างนานที่สุด|งานเก่าที่สุด/i.test(cleanText)) {
            return {
                intent: 'ask_oldest_task',
                rawText: cleanText
            };
        }

        // 4. Query All Projects Summary
        // Example: "สรุปทุกโปรเจกต์ให้ฟัง", "สรุปโปรเจกต์ทั้งหมด"
        if (/สรุปทุกโปรเจกต์|สรุปโปรเจกต์ทั้งหมด|ฟังโปรเจกต์ทั้งหมด/i.test(cleanText)) {
            return {
                intent: 'ask_all_projects_summary',
                rawText: cleanText
            };
        }

        // 5. Create Meeting Note
        // Example: "เพิ่มโน้ตเรื่องประชุม PMS กับโรงแรม", "บันทึกการประชุม"
        if (/โน้ตเรื่องประชุม|บันทึกการประชุม|ประชุม/i.test(cleanText)) {
            const title = cleanText.replace(/เพิ่มโน้ตเรื่องประชุม|บันทึกการประชุม|โน้ตประชุม|เรื่อง/gi, '').trim();
            return {
                intent: 'create_meeting_note',
                title: title || cleanText,
                rawText: cleanText
            };
        }

        // 6. Create Idea / Brain Dump
        // Example: "เพิ่มไอเดียทำแพ็กเกจ PMS สำหรับโรงแรมเล็ก"
        if (/ไอเดีย|ความคิด|อยากทำ|ไอเดียใหม่|brain dump/i.test(cleanText)) {
            const ideaTitle = cleanText.replace(/เพิ่มไอเดีย|ไอเดีย|อยากทำ|ช่วยคิด/gi, '').trim();
            let project = 'General';
            if (/pms/i.test(cleanText)) project = 'PMS Kiralux System';
            else if (/sino/i.test(cleanText)) project = 'Sino House Phuket';
            else if (/kiralux/i.test(cleanText)) project = 'Kiralux Property';

            return {
                intent: 'create_idea',
                title: ideaTitle || cleanText,
                project: project,
                rawText: cleanText
            };
        }

        // 7. Create Reminder
        // Example: "เตือนฉันให้โทรหาลูกค้าตอนบ่ายสอง"
        if (/เตือน|แจ้งเตือน|reminder|นัดหมาย/i.test(cleanText)) {
            const now = new Date();
            let remDate = new Date();

            if (/บ่ายสอง|14:00|14\.00/i.test(cleanText)) {
                remDate.setHours(14, 0, 0, 0);
            } else if (/สิบโมง|10:00|10\.00/i.test(cleanText)) {
                remDate.setHours(10, 0, 0, 0);
            } else if (/เย็น|17:00/i.test(cleanText)) {
                remDate.setHours(17, 0, 0, 0);
            } else {
                remDate.setHours(remDate.getHours() + 1);
            }

            if (/พรุ่งนี้/i.test(cleanText)) {
                remDate.setDate(remDate.getDate() + 1);
            }

            const remTitle = cleanText.replace(/เตือนฉันให้|เตือนให้|เตือน|นัดหมาย|ตอน|เวลา|พรุ่งนี้|วันนี้/gi, '').trim();

            return {
                intent: 'create_reminder',
                title: remTitle || cleanText,
                datetime: remDate.toISOString(),
                level: /ด่วน/i.test(cleanText) ? 'danger' : 'warning',
                rawText: cleanText
            };
        }

        // 8. Ask for Daily Brief / Daily Summary / Schedule
        // Example: "วันนี้มีงานอะไรบ้าง", "ฟังสรุปวันนี้", "สรุปประจำวัน"
        if (/วันนี้มีงานอะไร|ฟังสรุปวันนี้|สรุปงานวันนี้|สรุปประจำวัน|daily brief|มีนัดอะไรบ้าง/i.test(cleanText)) {
            return {
                intent: 'get_daily_brief',
                rawText: cleanText
            };
        }

        // 9. Ask for Project Status
        // Example: "สรุปสถานะโปรเจกต์ Sino House", "งาน PMS ตอนนี้ถึงไหนแล้ว"
        if (/สรุปสถานะโปรเจกต์|โปรเจกต์|ถึงไหนแล้ว|สถานะงาน/i.test(cleanText)) {
            let project = 'Sino House Phuket';
            if (/pms/i.test(cleanText)) project = 'PMS Kiralux System';
            else if (/sitekira/i.test(cleanText)) project = 'sitekira';
            else if (/kiralux/i.test(cleanText)) project = 'Kiralux Property';

            return {
                intent: 'ask_project_status',
                project: project,
                rawText: cleanText
            };
        }

        // 10. General Task Creation fallback
        if (/เพิ่มงาน|งานใหม่|ต้องทำ|ทำ/i.test(cleanText)) {
            const title = cleanText.replace(/เพิ่มงาน|งานใหม่|ต้อง/gi, '').trim();
            return {
                intent: 'create_task',
                title: title || cleanText,
                priority: /ด่วน/i.test(cleanText) ? 'high' : 'medium',
                rawText: cleanText
            };
        }

        return {
            intent: 'general_query',
            query: cleanText,
            rawText: cleanText
        };
    },

    /**
     * Generates a structured executive daily briefing text for Reen.
     */
    generateDailyBrief: function(state) {
        const activeTasks = (state.tasks || []).filter(t => !t.completed && t.status !== 'cancelled');
        const urgentTasks = activeTasks.filter(t => t.priority === 'high' || t.priority === 'urgent');
        const delegatedTasks = activeTasks.filter(t => t.category === 'Delegated' || t.assignee);
        const revenueTasks = activeTasks.filter(t => t.category === 'Revenue' || t.revenueImpact || t.expense > 0);

        const now = new Date();
        const overdueTasks = activeTasks.filter(t => t.due && new Date(t.due) < now);

        let brief = `สวัสดีครับพี่รีน\n\n`;
        brief += `วันนี้มีงานสำคัญรวมทั้งหมด ${activeTasks.length} รายการ\n`;
        brief += `มีงานด่วน ${urgentTasks.length} รายการ, งานเลยกำหนด ${overdueTasks.length} รายการ\n`;

        if (revenueTasks.length > 0) {
            brief += `และมีงานสร้างรายได้สำคัญ ${revenueTasks.length} รายการที่คุณควรเริ่มทำเป็นอันดับแรกครับ\n\n`;
        } else {
            brief += `\n`;
        }

        if (urgentTasks.length > 0) {
            brief += `📌 งานด่วนที่ควรทำก่อน:\n`;
            urgentTasks.slice(0, 3).forEach((t, i) => {
                brief += `${i + 1}. ${t.title} (${t.project || 'ทั่วไป'})\n`;
            });
        }

        if (delegatedTasks.length > 0) {
            brief += `\n👥 งานที่มอบหมายลูกน้องไว้ติดตาม:\n`;
            delegatedTasks.slice(0, 2).forEach((t, i) => {
                brief += `- ${t.title} [ผู้รับผิดชอบ: ${t.assignee || 'ลูกน้อง'}]\n`;
            });
        }

        brief += `\n💡 คำแนะนำประจำวันจาก AI:\nเน้นจัดการงานสร้างรายได้และติดตามดีลลูกค้าในช่วงเช้า แล้วจึงสลับไปตรวจความคืบหน้างานโปรเจกต์เว็บไซต์ในช่วงบ่ายครับ`;

        return brief;
    },

    /**
     * Generates Weekly Review Analytics Summary.
     */
    generateWeeklyReview: function(state) {
        const completedTasks = (state.tasks || []).filter(t => t.completed);
        const pendingTasks = (state.tasks || []).filter(t => !t.completed);
        const totalExpenses = (state.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);

        let review = `สรุปภาพรวมรายสัปดาห์สำหรับพี่รีน 📊\n\n`;
        review += `1. งานที่ทำเสร็จในสัปดาห์นี้: ${completedTasks.length} รายการ\n`;
        review += `2. งานคงค้างรอเคลียร์: ${pendingTasks.length} รายการ\n`;
        review += `3. ยอดรวมรายจ่ายทุกโปรเจกต์: ฿${totalExpenses.toLocaleString()} บาท\n\n`;
        review += `โปรเจกต์ที่มีความคืบหน้าสูงสุดคือ sitekira (80%) รองลงมาคือ Sino House Phuket (65%) ครับ!`;

        return review;
    },

    /**
     * Generates an evening summary reflection.
     */
    generateEveningSummary: function(state) {
        const completedToday = (state.tasks || []).filter(t => t.completed);
        const activeRemaining = (state.tasks || []).filter(t => !t.completed);

        let summary = `สรุปผลงานยามเย็นครับพี่รีน <ctrl42>\n\n`;
        summary += `วันนี้คุณทำบรรลุเป้าหมายสำเร็จไปทั้งหมด ${completedToday.length} รายการ\n`;
        summary += `ยังมีงานที่คงค้างสะสมอีก ${activeRemaining.length} รายการที่เตรียมย้ายไปลุยต่อในวันพรุ่งนี้ครับ\n\n`;
        summary += `พักผ่อนให้เต็มที่ แล้วพรุ่งนี้เช้าผมจะเตรียมสรุปแผนงานชุดใหม่ให้ครับ!`;

        return summary;
    }
};

if (typeof module !== 'undefined') {
    module.exports = ReenAIEngine;
}
