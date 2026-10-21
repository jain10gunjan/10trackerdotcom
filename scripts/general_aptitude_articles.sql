-- General Aptitude articles
-- Paste this whole script into the Supabase SQL editor and run it.
-- Re-running is safe: an existing category slug or article slug is skipped.

BEGIN;

INSERT INTO article_categories (name, slug, description, color)
VALUES (
  'General Aptitude',
  'general-aptitude',
  'Quantitative aptitude, reasoning, and verbal ability for placement and competitive exams.',
  '#7C3AED'
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO articles (
  title,
  slug,
  content,
  excerpt,
  category,
  tags,
  author_email,
  status,
  is_featured,
  view_count,
  created_at
) VALUES
(
  'Percentage Shortcuts That Show Up in Every Aptitude Paper',
  'percentage-shortcuts-for-aptitude-tests',
  $ga1$<h2>The conversions worth keeping</h2>
<p>Most percentage questions on a placement or aptitude paper are not hard arithmetic. They are slow arithmetic. If you already know a short list of fraction conversions, you can replace a long division with one multiplication.</p>
<p>Keep these in memory and use them without recalculating:</p>
<ul>
<li><strong>1/2 = 50%</strong>, <strong>1/3 = 33.33%</strong>, <strong>1/4 = 25%</strong>, <strong>1/5 = 20%</strong></li>
<li><strong>1/6 = 16.67%</strong>, <strong>1/8 = 12.5%</strong>, <strong>1/10 = 10%</strong>, <strong>1/20 = 5%</strong></li>
<li><strong>1/25 = 4%</strong>, <strong>3/4 = 75%</strong>, <strong>2/5 = 40%</strong>, <strong>3/8 = 37.5%</strong></li>
</ul>
<p>So 12.5% of 240 is the same as one-eighth of 240, which is 30. You do not need to write 12.5/100 and multiply.</p>
<h2>Swap the two numbers</h2>
<p>A second shortcut is easy to forget under a timer: <strong>x% of y equals y% of x</strong>. The product is the same either way.</p>
<p>Take 25% of 84. That is 84% of 25. Ten percent of 25 is 2.5, so 80% is 20, and 4% is 1. The answer is 21. The same idea helps when one of the numbers is a round 100, 50, or 25 and the other is awkward.</p>
<h2>Successive change is not ordinary addition</h2>
<p>If a value rises by a% and then by b%, the net change is not a + b. Use:</p>
<p><strong>Net percentage change = a + b + (a × b) / 100</strong></p>
<p>The second change acts on the new value, so the cross term is required. Put a fall in as a negative number.</p>
<p>A price rises 20% and then falls 20%. Net change = 20 + (−20) + (20 × −20) / 100 = −4. The price is 4% below the start, not back where it began. On 500, the path is 600 and then 480.</p>
<p>The same formula covers two rises. A quantity grows 10% and then 20%. Net change = 10 + 20 + (10 × 20) / 100 = 32%, not 30%.</p>
<h2>A question that uses both ideas</h2>
<p>A number is increased by 25% and the result is 180. What was the original number?</p>
<p>125% of the original is 180, so the original is 180 × 100 / 125. Since 125% is 5/4, dividing by 5/4 means multiplying by 4/5: 180 × 4 / 5 = 144.</p>
<p>Check: 25% of 144 is 36, and 144 + 36 = 180.</p>
<h2>The mistake that costs the mark</h2>
<p>When a question says “increased by 10% and then decreased by 10%,” do not cancel the two changes. Compute the net with the formula, or apply each step to the running total. Also watch the base. “20% more than last year” uses last year as the base. “20% of the new price” uses the new price. Read which number the percentage hangs on before you calculate.</p>
<p>Practice the fraction list until it is automatic, then use the swap and the successive-change formula on mixed questions. Those three tools cover a large share of the percentage section.</p>$ga1$,
  'Fraction conversions, the x% of y swap, and the successive percentage formula, with the 20% up then 20% down trap.',
  'general-aptitude',
  ARRAY['percentage', 'quantitative aptitude', 'shortcuts', 'general aptitude'],
  'jain10gunjan@gmail.com',
  'published',
  false,
  0,
  NOW()
),
(
  'Time and Work: Set the Equation Before You Calculate',
  'time-and-work-set-the-equation-first',
  $ga2$<h2>Work is a rate, not a pile of days</h2>
<p>Time and work questions become ordinary once you stop adding days. If a person finishes a job in n days, that person completes <strong>1/n of the job each day</strong>. Two people working together add their daily fractions. The day count comes out only after the rates are combined.</p>
<p>Write the whole job as 1. Everything else is a fraction of that 1.</p>
<h2>Two people on the same job</h2>
<p>A finishes a job in 10 days, so A’s rate is 1/10 per day. B finishes it in 15 days, so B’s rate is 1/15 per day. Together:</p>
<p><strong>1/10 + 1/15 = 3/30 + 2/30 = 5/30 = 1/6</strong></p>
<p>They complete one-sixth of the job each day, so the job takes 6 days. Adding 10 and 15, or averaging them, does not answer the question.</p>
<p>The general line is: if A takes a days and B takes b days, together they take <strong>ab / (a + b)</strong> days. For 10 and 15 that is 150 / 25 = 6. Use the fraction sum when a third person joins; the product formula is only the two-person case.</p>
<h2>Someone leaves midway</h2>
<p>A and B work together, but A stops after 2 days. How long does B need to finish the rest alone?</p>
<p>In 2 days, A has done 2/10 = 1/5 of the job. If they were together for those 2 days, B has also done 2/15. Combined work so far:</p>
<p><strong>2/10 + 2/15 = 3/15 + 2/15 = 5/15 = 1/3</strong></p>
<p>Remaining work is 2/3. B’s rate is 1/15 per day, so B needs (2/3) ÷ (1/15) = (2/3) × 15 = 10 more days.</p>
<p>Read the sentence carefully. “A works alone for 2 days, then B finishes” is a different sum from “both work for 2 days, then A leaves.” The first version leaves 4/5, and B needs (4/5) × 15 = 12 days.</p>
<h2>One of them is more efficient</h2>
<p>If A is 50% more efficient than B, A’s rate is 1.5 times B’s rate. Suppose B finishes in 15 days. Then A finishes in 15 / 1.5 = 10 days. Efficiency and time move in opposite directions: higher efficiency means fewer days for the same job.</p>
<h2>A clean order of work</h2>
<ol>
<li>Turn each worker into a daily fraction, 1/n.</li>
<li>Add the fractions for the days they actually work.</li>
<li>Subtract from 1 to get what is left.</li>
<li>Divide the remainder by the rate of whoever finishes it.</li>
</ol>
<p>If the fractions share an awkward denominator, you can set the total work to the LCM of the day counts instead of 1. With 10 and 15, total work can be 30 units. A does 3 units a day, B does 2. The arithmetic is the same idea with whole numbers. Either way, set the rates before you touch the calculator.</p>$ga2$,
  'Turn each worker into a daily fraction of the job, then handle combined work and the case where someone leaves midway.',
  'general-aptitude',
  ARRAY['time and work', 'quantitative aptitude', 'work rate', 'general aptitude'],
  'jain10gunjan@gmail.com',
  'published',
  false,
  0,
  NOW() - INTERVAL '1 minute'
),
(
  'Profit, Loss, and Discount: The Three Prices People Mix Up',
  'profit-loss-discount-three-prices',
  $ga3$<h2>Name the price before you use a percentage</h2>
<p>Profit and loss questions go wrong when three different prices are treated as one number. Keep them separate:</p>
<ul>
<li><strong>Cost price (CP)</strong> is what the seller paid.</li>
<li><strong>Marked price (MP)</strong> is the tag price before any discount.</li>
<li><strong>Selling price (SP)</strong> is what the buyer actually pays.</li>
</ul>
<p>Profit and loss percentages are taken on cost price. Discount percentages are taken on marked price. A discount is not a loss unless you also know the cost.</p>
<h2>Profit on cost, discount on the tag</h2>
<p><strong>Profit % = (SP − CP) / CP × 100</strong></p>
<p><strong>Discount % = (MP − SP) / MP × 100</strong></p>
<p>An item costs 400. It is marked at 500 and sold at a 10% discount. The discount is 10% of 500, so the selling price is 450. Profit is 50 on a cost of 400, which is 12.5%. It is not a 10% profit, and it is not a 10% loss.</p>
<h2>Two discounts in a row</h2>
<p>Successive discounts follow the same net-change rule as successive percentages. Discounts of a% and b% give a single equivalent discount of:</p>
<p><strong>a + b − (a × b) / 100</strong></p>
<p>Discounts of 20% and 10% are not 30% off. Equivalent discount = 20 + 10 − (20 × 10) / 100 = 28%. On a marked price of 1,000, the selling price is 1,000 × 0.80 × 0.90 = 720, which is 28% below 1,000.</p>
<p>Apply this only to the marked price. You still need the cost price before you can call the result a profit or a loss.</p>
<h2>False weight</h2>
<p>A seller who promises 1 kg but hands over 900 g, while charging the honest cost of 1 kg, is making a profit on the missing 100 g.</p>
<p>Cost of what was actually given = 0.9 × C. Money received = C. Profit = (C − 0.9C) / 0.9C = 0.1 / 0.9 = <strong>11.11%</strong>.</p>
<p>If that same seller also adds a stated 20% profit on the full kilogram, the buyer pays 1.2C for goods that cost the seller 0.9C. Actual profit = (1.2C − 0.9C) / 0.9C = 0.3 / 0.9 = <strong>33.33%</strong>. The stated 20% is not the real gain.</p>
<h2>A short checklist</h2>
<ol>
<li>Write CP, MP, and SP as three labels before any percentage.</li>
<li>Take profit or loss on CP. Take discount on MP.</li>
<li>Chain two discounts with a + b − ab/100, or multiply the factors (0.80 × 0.90).</li>
<li>For a short weight, divide the gain by the quantity actually handed over, not by the quantity printed on the pack.</li>
</ol>
<p>Once the base of each percentage is named, these questions are a few multiplications. The marks are lost in the setup, not in the arithmetic.</p>$ga3$,
  'Separate cost price, marked price, and selling price, then handle successive discounts and a false-weight profit.',
  'general-aptitude',
  ARRAY['profit and loss', 'discount', 'quantitative aptitude', 'general aptitude'],
  'jain10gunjan@gmail.com',
  'published',
  false,
  0,
  NOW() - INTERVAL '2 minutes'
),
(
  'Number System Patterns Worth Memorizing',
  'number-system-patterns-worth-memorizing',
  $ga4$<h2>Divisibility checks you can do on sight</h2>
<p>A number-system question often asks only whether a large number divides evenly. You do not need the quotient. These checks are enough for the usual tests:</p>
<ul>
<li><strong>2</strong>: last digit is even.</li>
<li><strong>3 or 9</strong>: the sum of the digits is divisible by 3 or by 9.</li>
<li><strong>4</strong>: the last two digits form a number divisible by 4.</li>
<li><strong>5</strong>: the last digit is 0 or 5.</li>
<li><strong>8</strong>: the last three digits form a number divisible by 8.</li>
<li><strong>11</strong>: the alternating sum of the digits is a multiple of 11, including 0.</li>
</ul>
<p>For 918,291 and divisibility by 11: 9 − 1 + 8 − 2 + 9 − 1 = 22. Since 22 is a multiple of 11, the whole number is divisible by 11. For 5,736 and divisibility by 8, look only at 736. Half of 736 is 368, half again is 184, half again is 92, so 736 is divisible by 8 and so is 5,736.</p>
<h2>Unit digits repeat in a short cycle</h2>
<p>The units digit of a power depends only on the units digit of the base, and that digit repeats. You never need the full power.</p>
<ul>
<li>Powers of <strong>2</strong>: 2, 4, 8, 6, then repeat. Cycle length 4.</li>
<li>Powers of <strong>3</strong>: 3, 9, 7, 1. Cycle length 4.</li>
<li>Powers of <strong>7</strong>: 7, 9, 3, 1. Cycle length 4.</li>
<li>Powers of <strong>4</strong>: 4, 6. Cycle length 2. Powers of <strong>9</strong>: 9, 1. Cycle length 2.</li>
<li>Powers of <strong>5</strong> end in 5. Powers of <strong>6</strong> end in 6.</li>
</ul>
<p>Divide the exponent by the cycle length and use the remainder as the position in the cycle. If the remainder is 0, use the last digit of the cycle.</p>
<p>Units digit of 7<sup>23</sup>: 23 ÷ 4 leaves remainder 3, so take the third entry, which is 3. Units digit of 2<sup>10</sup>: 10 ÷ 4 leaves remainder 2, so take the second entry, which is 4. That matches 1,024. Units digit of 3<sup>20</sup>: 20 ÷ 4 leaves remainder 0, so take the last entry of the cycle, which is 1.</p>
<h2>Remainders use the same cycle</h2>
<p>Finding 2<sup>10</sup> divided by 5 is the same habit with a different cycle. Powers of 2 modulo 5 run 2, 4, 3, 1 and then repeat. The tenth power sits at position 2 in that cycle, so the remainder is 4. You can check: 1,024 = 5 × 204 + 4.</p>
<p>When the divisor is small, write the first few remainders until the list repeats, then map the exponent onto that list. Do not expand the power.</p>
<h2>What to drill</h2>
<p>Memorize the divisibility list and the unit-digit cycles for 2, 3, 4, 7, 8, and 9. In a timed paper, the win is noticing that the question is a cycle problem and stopping after the remainder of the exponent. If the remainder of the exponent is 0, take the end of the cycle, not the first entry.</p>$ga4$,
  'Divisibility checks, unit-digit cycles for powers, and a remainder method that avoids expanding the power.',
  'general-aptitude',
  ARRAY['number system', 'divisibility', 'unit digit', 'general aptitude'],
  'jain10gunjan@gmail.com',
  'published',
  false,
  0,
  NOW() - INTERVAL '3 minutes'
),
(
  'How to Attempt Verbal Ability Under a Time Limit',
  'verbal-ability-under-a-time-limit',
  $ga5$<h2>One rule at a time</h2>
<p>Verbal questions in a general aptitude paper are short, but they still eat the clock if you reread the whole sentence hoping the error will announce itself. A faster method is to test one grammar rule, reject the options that break it, and only then look at the next rule.</p>
<p>Use this order. It matches how most error-spotting and sentence-correction items are built:</p>
<ol>
<li><strong>Subject and verb.</strong> Does the verb match the real subject in number?</li>
<li><strong>Tense.</strong> Do the verbs sit in one time, unless the meaning needs a shift?</li>
<li><strong>Pronoun.</strong> Is it clear who “it,” “they,” or “which” points to, and does it match in number?</li>
<li><strong>Modifier.</strong> Is a descriptive phrase attached to the noun it is supposed to describe?</li>
</ol>
<h2>Subject and verb</h2>
<p>The verb agrees with the subject, not with a noun that happens to sit next to it. In “The list of names is on the desk,” the subject is “list,” which is singular, so the verb is “is.” The plural “names” is only inside a phrase.</p>
<p>Watch “or” and “nor.” The verb follows the subject closer to it: “Neither the students nor the teacher was late.” With “and,” the subject is usually plural: “The teacher and the student were late.”</p>
<p>Phrases such as “along with,” “as well as,” and “together with” do not make a singular subject plural. “The captain, along with the players, was delayed” is correct. “Players” is not part of the subject.</p>
<h2>Tense and pronouns</h2>
<p>If the sentence is set in the past, do not drop a present-tense verb in the middle unless the fact is still true. “She said that she was tired” reports a past statement. “She said that water boils at 100 degrees” can stay in the present because the fact has not changed.</p>
<p>A pronoun needs one clear noun. “When Ravi met Amit, he was late” does not say who was late. If the options repair that, prefer the one that names the person. Also match number: “Each of the candidates must bring their own pen” is often tested; the strict form used in these papers is “his or her,” or a rewrite that starts with “All candidates.”</p>
<h2>Modifiers</h2>
<p>A phrase at the start of a sentence should describe the subject that follows it. “Walking to the exam hall, the rain started” says the rain was walking. The repair is “Walking to the exam hall, I felt the rain start,” because “I” is the one walking.</p>
<h2>How to spend the minute</h2>
<p>On a four-option correction item, strike any option that fails the first rule you can check. Often two options die on subject-verb agreement and you never read them for style. If two options are both grammatical, pick the shorter one that keeps the original meaning. Do not choose a fancy rewrite that adds a fact the sentence did not have.</p>
<p>For a short passage, read the question before the paragraph when the question is specific (“what is the main reason…”). You then know what to mark. Read the paragraph first only when the question is about tone or the passage as a whole.</p>
<p>The aim is not to become a grammarian in the exam hall. It is to run the same four checks in the same order so a 40-second item stays a 40-second item.</p>$ga5$,
  'A fixed order for error spotting and sentence correction: subject-verb, tense, pronoun, then modifier.',
  'general-aptitude',
  ARRAY['verbal ability', 'error spotting', 'sentence correction', 'general aptitude'],
  'jain10gunjan@gmail.com',
  'published',
  false,
  0,
  NOW() - INTERVAL '4 minutes'
)
ON CONFLICT (slug) DO NOTHING;

COMMIT;

SELECT slug, title, category, status
FROM articles
WHERE category = 'general-aptitude'
ORDER BY created_at DESC;
