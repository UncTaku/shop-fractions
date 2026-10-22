// Card data — transcribed from Machine Fundamentals p.412.
// One object per card. To add a card later (e.g. 64ths), add one line here
// and bump VERSION in sw.js so phones pick up the change.
//
//   frac:   the reduced fraction (what you'd say on the floor)
//   equiv:  other forms from the table (shown on the back as a bonus)
//   dec:    decimal, 4 places as printed in the book
//   spoken: the "Spoken like a Machinist" column, word for word
const CARDS = [
  { frac: "1/16",  equiv: [],                         dec: "0.0625", spoken: "Sixty-two thousandths, five tenths" },
  { frac: "1/8",   equiv: ["2/16"],                   dec: "0.1250", spoken: "One hundred twenty-five thousandths" },
  { frac: "3/16",  equiv: [],                         dec: "0.1875", spoken: "One hundred eighty-seven thousandths, five tenths" },
  { frac: "1/4",   equiv: ["2/8", "4/16"],            dec: "0.2500", spoken: "Two hundred fifty thousandths" },
  { frac: "5/16",  equiv: [],                         dec: "0.3125", spoken: "Three hundred twelve thousandths, five tenths" },
  { frac: "3/8",   equiv: ["6/16"],                   dec: "0.3750", spoken: "Three hundred seventy-five thousandths" },
  { frac: "7/16",  equiv: [],                         dec: "0.4375", spoken: "Four hundred thirty-seven thousandths, five tenths" },
  { frac: "1/2",   equiv: ["2/4", "4/8", "8/16"],     dec: "0.5000", spoken: "Five hundred thousandths" },
  { frac: "9/16",  equiv: [],                         dec: "0.5625", spoken: "Five hundred sixty-two thousandths, five tenths" },
  { frac: "5/8",   equiv: ["10/16"],                  dec: "0.6250", spoken: "Six hundred twenty-five thousandths" },
  { frac: "11/16", equiv: [],                         dec: "0.6875", spoken: "Six hundred eighty-seven thousandths, five tenths" },
  { frac: "3/4",   equiv: ["6/8", "12/16"],           dec: "0.7500", spoken: "Seven hundred fifty thousandths" },
  { frac: "13/16", equiv: [],                         dec: "0.8125", spoken: "Eight hundred twelve thousandths, five tenths" },
  { frac: "7/8",   equiv: ["14/16"],                  dec: "0.8750", spoken: "Eight hundred seventy-five thousandths" },
  { frac: "15/16", equiv: [],                         dec: "0.9375", spoken: "Nine hundred thirty-seven thousandths, five tenths" },
];
