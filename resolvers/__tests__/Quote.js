import {Quote} from '../Quote';

describe('Quote resolver', () => {
  it('should give you the right amount for the total', async () => {
    const mockQuote = {
      id: '1',
      options: [
        {
          sections: [
            {
              items: [
                {
                  unitPrice: 10,
                  unit: 2,
                },
                {
                  unitPrice: 5,
                  unit: 1,
                },
              ],
            },
            {
              items: [
                {
                  unitPrice: 3,
                  unit: 1,
                },
              ],
            },
          ],
        },
      ],
    };

    const total = await Quote.total(
      mockQuote,
      {},
      {
        db: {
          quote: () => ({
            $fragment: () => mockQuote,
          }),
        },
      },
    );

    expect(total).toBe(28);
  });
});
