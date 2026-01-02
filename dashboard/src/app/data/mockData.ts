// Mock data for the Prompt Optimization Dashboard

export interface Prompt {
  id: string;
  name: string;
  template: string;
  createdAt: string;
  runCount: number;
  bestAccuracy: number;
}

export interface Run {
  id: string;
  promptId: string;
  accuracy: number;
  status: 'completed' | 'running' | 'failed';
  date: string;
  categoryBreakdown: CategoryAccuracy[];
  confusionMatrix: { [key: string]: { [key: string]: number } };
  failedCases: FailedCase[];
}

export interface CategoryAccuracy {
  category: string;
  accuracy: number;
  total: number;
}

export interface FailedCase {
  id: number;
  ticket: string;
  expected: string;
  predicted: string;
}

export interface TestCase {
  id: number;
  ticket: string;
  expectedCategory: string;
}

export const CATEGORIES = [
  'DELIVERY',
  'SHIPPING',
  'PAYMENT',
  'REFUND',
  'PRODUCT',
  'ACCOUNT',
  'TECHNICAL',
  'BILLING',
  'CANCELLATION',
  'TRACKING',
  'OTHER'
];

export const prompts: Prompt[] = [
  {
    id: 'prompt-v1',
    name: 'Basic Classifier v1',
    template: `Classify the following customer support ticket into one of these categories: ${CATEGORIES.join(', ')}.

Ticket: {ticket}

Category:`,
    createdAt: '2025-12-15',
    runCount: 12,
    bestAccuracy: 76.3
  },
  {
    id: 'prompt-v2',
    name: 'Enhanced Classifier v2',
    template: `You are a customer support ticket classifier. Analyze the ticket carefully and classify it into the most appropriate category.

Categories: ${CATEGORIES.join(', ')}

Rules:
- Focus on the primary issue
- Consider the customer's intent
- Be consistent with edge cases

Ticket: {ticket}

Category:`,
    createdAt: '2025-12-20',
    runCount: 8,
    bestAccuracy: 87.4
  },
  {
    id: 'prompt-v3',
    name: 'Optimized Classifier v3',
    template: `You are an expert customer support ticket classifier. Your task is to categorize tickets with high accuracy.

Available categories: ${CATEGORIES.join(', ')}

Classification guidelines:
1. DELIVERY/SHIPPING: Issues with delivery status, speed, or shipping methods
2. PAYMENT/BILLING: Payment processing, charges, invoices
3. REFUND: Return requests and refund inquiries
4. PRODUCT: Product quality, features, or availability questions
5. ACCOUNT: Login, registration, profile issues
6. TECHNICAL: Website bugs, app crashes, technical errors
7. CANCELLATION: Order or subscription cancellations
8. TRACKING: Package tracking inquiries
9. OTHER: Anything not fitting above categories

Ticket text: {ticket}

Output only the category name:`,
    createdAt: '2025-12-28',
    runCount: 5,
    bestAccuracy: 92.9
  }
];

export const runs: Run[] = [
  // Prompt v1 runs
  {
    id: 'run-1',
    promptId: 'prompt-v1',
    accuracy: 76.3,
    status: 'completed',
    date: '2025-12-15T10:30:00Z',
    categoryBreakdown: [
      { category: 'DELIVERY', accuracy: 82, total: 25 },
      { category: 'SHIPPING', accuracy: 68, total: 18 },
      { category: 'PAYMENT', accuracy: 75, total: 20 },
      { category: 'REFUND', accuracy: 79, total: 19 },
      { category: 'PRODUCT', accuracy: 71, total: 17 },
      { category: 'ACCOUNT', accuracy: 77, total: 22 },
      { category: 'TECHNICAL', accuracy: 73, total: 15 },
      { category: 'BILLING', accuracy: 80, total: 20 },
      { category: 'CANCELLATION', accuracy: 85, total: 17 },
      { category: 'TRACKING', accuracy: 70, total: 15 },
      { category: 'OTHER', accuracy: 60, total: 10 }
    ],
    confusionMatrix: {
      'DELIVERY': { 'DELIVERY': 20, 'SHIPPING': 3, 'TRACKING': 2 },
      'SHIPPING': { 'SHIPPING': 12, 'DELIVERY': 4, 'TRACKING': 2 },
      'PAYMENT': { 'PAYMENT': 15, 'BILLING': 3, 'REFUND': 2 },
      'REFUND': { 'REFUND': 15, 'CANCELLATION': 2, 'PAYMENT': 2 },
      'PRODUCT': { 'PRODUCT': 12, 'OTHER': 3, 'TECHNICAL': 2 }
    },
    failedCases: [
      { id: 42, ticket: 'Where is my package?', expected: 'DELIVERY', predicted: 'SHIPPING' },
      { id: 87, ticket: 'I was charged twice', expected: 'BILLING', predicted: 'PAYMENT' },
      { id: 134, ticket: 'Need to return this item', expected: 'REFUND', predicted: 'CANCELLATION' },
      { id: 156, ticket: 'Can\'t login to my account', expected: 'ACCOUNT', predicted: 'TECHNICAL' },
      { id: 189, ticket: 'Product damaged on arrival', expected: 'PRODUCT', predicted: 'DELIVERY' }
    ]
  },
  // Prompt v2 runs
  {
    id: 'run-2',
    promptId: 'prompt-v2',
    accuracy: 87.4,
    status: 'completed',
    date: '2025-12-20T14:15:00Z',
    categoryBreakdown: [
      { category: 'DELIVERY', accuracy: 92, total: 25 },
      { category: 'SHIPPING', accuracy: 83, total: 18 },
      { category: 'PAYMENT', accuracy: 85, total: 20 },
      { category: 'REFUND', accuracy: 89, total: 19 },
      { category: 'PRODUCT', accuracy: 82, total: 17 },
      { category: 'ACCOUNT', accuracy: 90, total: 22 },
      { category: 'TECHNICAL', accuracy: 87, total: 15 },
      { category: 'BILLING', accuracy: 90, total: 20 },
      { category: 'CANCELLATION', accuracy: 94, total: 17 },
      { category: 'TRACKING', accuracy: 80, total: 15 },
      { category: 'OTHER', accuracy: 70, total: 10 }
    ],
    confusionMatrix: {
      'DELIVERY': { 'DELIVERY': 23, 'SHIPPING': 1, 'TRACKING': 1 },
      'SHIPPING': { 'SHIPPING': 15, 'DELIVERY': 2, 'TRACKING': 1 },
      'PAYMENT': { 'PAYMENT': 17, 'BILLING': 2, 'REFUND': 1 },
      'REFUND': { 'REFUND': 17, 'CANCELLATION': 1, 'PAYMENT': 1 },
      'PRODUCT': { 'PRODUCT': 14, 'OTHER': 2, 'TECHNICAL': 1 }
    },
    failedCases: [
      { id: 42, ticket: 'Where is my package?', expected: 'DELIVERY', predicted: 'TRACKING' },
      { id: 103, ticket: 'General inquiry about shipping', expected: 'SHIPPING', predicted: 'OTHER' },
      { id: 167, ticket: 'App keeps crashing', expected: 'TECHNICAL', predicted: 'ACCOUNT' }
    ]
  },
  // Prompt v3 runs
  {
    id: 'run-3',
    promptId: 'prompt-v3',
    accuracy: 92.9,
    status: 'completed',
    date: '2025-12-28T09:45:00Z',
    categoryBreakdown: [
      { category: 'DELIVERY', accuracy: 96, total: 25 },
      { category: 'SHIPPING', accuracy: 94, total: 18 },
      { category: 'PAYMENT', accuracy: 90, total: 20 },
      { category: 'REFUND', accuracy: 95, total: 19 },
      { category: 'PRODUCT', accuracy: 88, total: 17 },
      { category: 'ACCOUNT', accuracy: 95, total: 22 },
      { category: 'TECHNICAL', accuracy: 93, total: 15 },
      { category: 'BILLING', accuracy: 95, total: 20 },
      { category: 'CANCELLATION', accuracy: 100, total: 17 },
      { category: 'TRACKING', accuracy: 87, total: 15 },
      { category: 'OTHER', accuracy: 80, total: 10 }
    ],
    confusionMatrix: {
      'DELIVERY': { 'DELIVERY': 24, 'TRACKING': 1 },
      'SHIPPING': { 'SHIPPING': 17, 'DELIVERY': 1 },
      'PAYMENT': { 'PAYMENT': 18, 'BILLING': 2 },
      'REFUND': { 'REFUND': 18, 'CANCELLATION': 1 },
      'PRODUCT': { 'PRODUCT': 15, 'OTHER': 2 }
    },
    failedCases: [
      { id: 42, ticket: 'Where is my package?', expected: 'DELIVERY', predicted: 'TRACKING' },
      { id: 189, ticket: 'Product quality issue', expected: 'PRODUCT', predicted: 'OTHER' }
    ]
  }
];

// Generate test cases
export const testCases: TestCase[] = Array.from({ length: 198 }, (_, i) => {
  const categoryIndex = i % CATEGORIES.length;
  const category = CATEGORIES[categoryIndex];
  
  const tickets: { [key: string]: string[] } = {
    'DELIVERY': ['Where is my order?', 'Delivery is late', 'Package not arrived', 'Delivery status?'],
    'SHIPPING': ['How long does shipping take?', 'Shipping options available?', 'Express shipping cost?'],
    'PAYMENT': ['Payment failed', 'Can I use PayPal?', 'Payment methods?', 'Card declined'],
    'REFUND': ['I want a refund', 'Return process?', 'Money back guarantee?', 'Refund status?'],
    'PRODUCT': ['Product quality bad', 'Is this in stock?', 'Product features?', 'Wrong item received'],
    'ACCOUNT': ['Can\'t login', 'Reset password', 'Account locked', 'Update profile'],
    'TECHNICAL': ['Website error', 'App crashing', 'Page not loading', 'Bug report'],
    'BILLING': ['Invoice needed', 'Billing question', 'Subscription charge', 'Payment history'],
    'CANCELLATION': ['Cancel my order', 'Cancel subscription', 'Stop delivery', 'Remove order'],
    'TRACKING': ['Track my package', 'Tracking number?', 'Where is it now?', 'Shipment location'],
    'OTHER': ['General question', 'Something else', 'Not sure', 'Other inquiry']
  };
  
  const ticketTemplates = tickets[category] || ['Sample ticket'];
  const ticket = ticketTemplates[i % ticketTemplates.length];
  
  return {
    id: i + 1,
    ticket: `${ticket} - Case ${i + 1}`,
    expectedCategory: category
  };
});

export const aiSuggestions = {
  'prompt-v1': {
    analysis: 'The current prompt lacks specific guidance for edge cases and doesn\'t provide clear distinctions between similar categories like DELIVERY and SHIPPING. The model is confusing closely related categories at a rate of 23.7%, particularly struggling with SHIPPING (68% accuracy) and OTHER (60% accuracy).',
    suggestions: [
      {
        priority: 'high',
        text: 'Add clear distinction between DELIVERY (status of existing shipments) and SHIPPING (shipping options/methods) to reduce the 7 misclassifications between these categories.'
      },
      {
        priority: 'high',
        text: 'Provide specific examples for the OTHER category to improve its 60% accuracy. Currently, too many edge cases default to OTHER.'
      },
      {
        priority: 'medium',
        text: 'Include a rule to distinguish PAYMENT vs BILLING - payment processing issues vs billing inquiries/invoices.'
      },
      {
        priority: 'medium',
        text: 'Add instruction to focus on the customer\'s primary intent rather than secondary mentions of categories.'
      }
    ]
  },
  'prompt-v2': {
    analysis: 'Good improvement with structured rules, but still seeing 12.6% error rate. The main issues are with the TRACKING category (80% accuracy) and distinguishing between related financial categories. The prompt would benefit from more specific guidelines for ambiguous cases.',
    suggestions: [
      {
        priority: 'medium',
        text: 'Strengthen TRACKING category definition - currently being confused with DELIVERY. Emphasize that TRACKING is specifically about finding package location.'
      },
      {
        priority: 'medium',
        text: 'Add more context about how to handle tickets that mention multiple categories - guide the model to select the primary issue.'
      },
      {
        priority: 'low',
        text: 'Consider adding a few-shot examples for the most commonly confused category pairs.'
      }
    ]
  },
  'prompt-v3': {
    analysis: 'Excellent performance at 92.9% accuracy! The detailed guidelines are working well. The remaining 7.1% error rate is primarily in edge cases. Minor improvements possible in TRACKING (87%) and OTHER (80%) categories.',
    suggestions: [
      {
        priority: 'low',
        text: 'Refine TRACKING vs DELIVERY distinction further - add note that questions about "where is my package" should focus on whether they want location info (TRACKING) or delivery completion (DELIVERY).'
      },
      {
        priority: 'low',
        text: 'Consider adding a final validation step: "Does this ticket clearly match one of the defined categories? If yes, output that category. If unclear, output OTHER."'
      }
    ]
  }
};
