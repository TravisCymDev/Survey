const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

app.post('/submit-survey', async (req, res) => {
  const { email, question1, question1Other, question2, question2Other } = req.body;

  try {
    // Step 1: Get the customer ID using the email
    const searchUrl = `https://${process.env.SHOP}.myshopify.com/admin/api/2024-04/customers/search.json?query=email:${email}`;
    
    const searchRes = await axios.get(searchUrl, {
      headers: {
        'X-Shopify-Access-Token': process.env.ADMIN_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    const customer = searchRes.data.customers[0];
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerId = customer.id;

    // Step 2: Set metafields
    const metafields = [
      {
        namespace: 'custom',
        key: 'question_1_answers',
        type: 'multi_line_text_field',
        value: question1.concat(question1Other ? [`Other: ${question1Other}`] : []).join('\n')
      },
      {
        namespace: 'custom',
        key: 'question_2_answers',
        type: 'multi_line_text_field',
        value: question2.concat(question2Other ? [`Other: ${question2Other}`] : []).join('\n')
      }
    ];

    for (const metafield of metafields) {
      await axios.post(
        `https://${process.env.SHOP}.myshopify.com/admin/api/2024-04/customers/${customerId}/metafields.json`,
        { metafield },
        {
          headers: {
            'X-Shopify-Access-Token': process.env.ADMIN_API_TOKEN,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
