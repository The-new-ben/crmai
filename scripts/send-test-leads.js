#!/usr/bin/env node

/**
 * Test Lead Generator
 * Sends test leads to the API for development/testing
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';

const testLeads = [
    {
        name: "John Smith",
        phone: "+1234567890",
        email: "john.smith@example.com",
        message: "I'm interested in buying a luxury property in the downtown area. Budget around $500,000.",
        language: "en",
        channel: "web"
    },
    {
        name: "יוסי כהן",
        phone: "+972501234567",
        email: "yossi@example.co.il",
        message: "אני צריך עורך דין לתביעת נזיקין. נפגעתי בתאונת עבודה.",
        language: "he",
        channel: "whatsapp"
    },
    {
        name: "Sarah Davis",
        phone: "+1555123456",
        email: "sarah.d@example.com",
        message: "Looking for consulting services for my startup. Need help with business strategy.",
        language: "en",
        channel: "email"
    },
    {
        name: "Michael Chen",
        phone: "+1666789012",
        email: "mchen@example.com",
        message: "URGENT: Need to sell my property ASAP due to relocation. 4 bedroom house.",
        language: "en",
        channel: "voice"
    },
    {
        name: "דנה אברהם",
        phone: "+972521234567",
        email: "dana.a@example.co.il",
        message: "מחפשת ייעוץ משפטי בנושא גירושין. יש ילדים ורכוש משותף.",
        language: "he",
        channel: "whatsapp"
    }
];

async function sendTestLead(lead) {
    try {
        const response = await fetch(`${API_URL}/api/ingest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Source-Channel': lead.channel,
                'X-Source-Provider': 'test_script'
            },
            body: JSON.stringify({
                name: lead.name,
                phone: lead.phone,
                email: lead.email,
                message: lead.message,
                text: lead.message,
                language: lead.language,
                timestamp: new Date().toISOString()
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log(`✅ Lead sent: ${lead.name}`);
            console.log(`   ID: ${result.leadId}`);
            console.log(`   Intent: ${result.classification?.intent}`);
            console.log(`   Urgency: ${result.classification?.urgency}`);
            console.log(`   Persona: ${result.classification?.persona}`);
            console.log('');
        } else {
            console.log(`❌ Failed: ${lead.name} - ${result.error}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${lead.name} - ${error.message}`);
    }
}

async function main() {
    console.log('🚀 Zero-Touch Test Lead Generator\n');
    console.log(`API: ${API_URL}\n`);
    console.log('─'.repeat(50));

    const args = process.argv.slice(2);

    if (args[0] === '--all') {
        // Send all test leads
        console.log(`Sending ${testLeads.length} test leads...\n`);

        for (const lead of testLeads) {
            await sendTestLead(lead);
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second between leads
        }
    } else if (args[0] === '--random') {
        // Send a random lead
        const randomLead = testLeads[Math.floor(Math.random() * testLeads.length)];
        console.log('Sending random test lead...\n');
        await sendTestLead(randomLead);
    } else if (args[0]) {
        // Send custom lead
        const customLead = {
            name: args[0] || 'Test User',
            phone: args[1] || '+1234567890',
            email: args[2] || 'test@example.com',
            message: args.slice(3).join(' ') || 'Test message from CLI',
            language: 'en',
            channel: 'web'
        };
        console.log('Sending custom test lead...\n');
        await sendTestLead(customLead);
    } else {
        console.log('Usage:');
        console.log('  node send-test-leads.js --all           Send all test leads');
        console.log('  node send-test-leads.js --random        Send a random lead');
        console.log('  node send-test-leads.js <name> <phone> <email> <message>');
        console.log('');
        console.log('Example:');
        console.log('  node send-test-leads.js "Jane Doe" "+15551234" "jane@test.com" "I need help"');
    }

    console.log('─'.repeat(50));
    console.log('Done!');
}

main().catch(console.error);
