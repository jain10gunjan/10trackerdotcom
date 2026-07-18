-- Sample GATE CSE Questions for Testing
-- Run this in your Supabase SQL Editor after setting up the main tables

-- Insert sample GATE CSE questions into examtracker table
INSERT INTO examtracker (category, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty) VALUES
-- Algorithms
('GATE_CSE', 'What is the time complexity of binary search algorithm?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'B', 'Binary search has logarithmic time complexity as it divides the search space in half at each step.', 'Algorithms', 'medium'),

('GATE_CSE', 'Which sorting algorithm has the best average-case time complexity?', 'Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort', 'B', 'Quick Sort has O(n log n) average-case time complexity.', 'Algorithms', 'hard'),

('GATE_CSE', 'What is the space complexity of merge sort?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'C', 'Merge sort requires additional space proportional to the input size.', 'Algorithms', 'medium'),

-- Programming & Data Structures
('GATE_CSE', 'Which of the following is NOT a valid data structure?', 'Stack', 'Queue', 'Tree', 'Loop', 'D', 'Loop is a control structure, not a data structure.', 'Programming & Data Structures', 'easy'),

('GATE_CSE', 'What is the time complexity of inserting an element at the beginning of an array?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'C', 'All elements need to be shifted to make space for the new element.', 'Programming & Data Structures', 'medium'),

('GATE_CSE', 'What is the output of the following C code?<br>int x = 5;<br>printf("%d", x++);', '4', '5', '6', 'Undefined', 'B', 'Post-increment operator returns the original value before incrementing.', 'Programming & Data Structures', 'medium'),

-- Operating Systems
('GATE_CSE', 'Which scheduling algorithm is preemptive?', 'First Come First Serve', 'Shortest Job First', 'Round Robin', 'All of the above', 'C', 'Round Robin is preemptive as it uses time quantum to switch between processes.', 'Operating Systems', 'medium'),

('GATE_CSE', 'What is the main purpose of virtual memory?', 'Increase RAM speed', 'Allow programs to use more memory than physically available', 'Reduce CPU usage', 'Improve disk performance', 'B', 'Virtual memory allows programs to use more memory than physically available by using disk space.', 'Operating Systems', 'medium'),

-- Discrete Mathematics & Graph Theory
('GATE_CSE', 'What is the maximum number of edges in a graph with n vertices?', 'n', 'n-1', 'n(n-1)/2', 'n²', 'C', 'In a complete graph, each vertex connects to every other vertex.', 'Discrete Mathematics & Graph Theory', 'easy'),

('GATE_CSE', 'How many different binary trees can be formed with 3 nodes?', '3', '5', '7', '9', 'B', 'There are 5 different binary tree structures possible with 3 nodes.', 'Discrete Mathematics & Graph Theory', 'medium'),

-- Computer Networks
('GATE_CSE', 'Which protocol operates at the transport layer?', 'HTTP', 'TCP', 'IP', 'ARP', 'B', 'TCP (Transmission Control Protocol) operates at the transport layer.', 'Computer Networks', 'medium'),

('GATE_CSE', 'What is the default port number for HTTP?', '80', '443', '8080', '21', 'A', 'HTTP uses port 80 by default.', 'Computer Networks', 'easy'),

-- Database Management Systems
('GATE_CSE', 'Which normal form eliminates transitive dependencies?', '1NF', '2NF', '3NF', 'BCNF', 'C', 'Third Normal Form (3NF) eliminates transitive dependencies.', 'DBMS', 'medium'),

('GATE_CSE', 'What is ACID in database systems?', 'Atomicity, Consistency, Isolation, Durability', 'Availability, Consistency, Integrity, Durability', 'Atomicity, Consistency, Integrity, Durability', 'Availability, Consistency, Isolation, Durability', 'A', 'ACID stands for Atomicity, Consistency, Isolation, Durability.', 'DBMS', 'medium'),

-- Theory of Computation
('GATE_CSE', 'Which of the following is a regular language?', 'a^n b^n | n ≥ 0', 'a^n b^n c^n | n ≥ 0', 'a^n b^m | n, m ≥ 0', 'a^n b^n c^m | n, m ≥ 0', 'C', 'a^n b^m is a regular language as it can be recognized by a finite automaton.', 'Theory of Computation', 'hard'),

('GATE_CSE', 'What type of grammar is most restrictive?', 'Type 0', 'Type 1', 'Type 2', 'Type 3', 'D', 'Type 3 (Regular Grammar) is the most restrictive.', 'Theory of Computation', 'medium'),

-- Computer Organization
('GATE_CSE', 'What is the function of ALU in CPU?', 'Control unit operations', 'Arithmetic and logical operations', 'Memory management', 'Input/output operations', 'B', 'ALU (Arithmetic Logic Unit) performs arithmetic and logical operations.', 'Computer Organization', 'easy'),

('GATE_CSE', 'Which memory is fastest?', 'Hard Disk', 'RAM', 'Cache', 'ROM', 'C', 'Cache memory is the fastest among the given options.', 'Computer Organization', 'medium'),

-- Digital Logic
('GATE_CSE', 'What is the output of AND gate if both inputs are 1?', '0', '1', 'Undefined', 'Depends on gate type', 'B', 'AND gate outputs 1 only when both inputs are 1.', 'Digital Logic', 'easy'),

('GATE_CSE', 'How many inputs does a full adder have?', '2', '3', '4', '5', 'B', 'A full adder has 3 inputs: A, B, and carry-in.', 'Digital Logic', 'medium'),

-- Compiler Design
('GATE_CSE', 'Which phase of compiler comes first?', 'Lexical Analysis', 'Syntax Analysis', 'Semantic Analysis', 'Code Generation', 'A', 'Lexical Analysis is the first phase of compilation.', 'Compiler Design', 'medium'),

('GATE_CSE', 'What is the output of lexical analyzer?', 'Tokens', 'Parse Tree', 'Abstract Syntax Tree', 'Machine Code', 'A', 'Lexical analyzer produces tokens as output.', 'Compiler Design', 'medium')

ON CONFLICT DO NOTHING;

-- Verify the insertion
SELECT COUNT(*) as total_gate_questions FROM examtracker WHERE category = 'GATE_CSE';

-- Show sample questions by topic
SELECT topic, COUNT(*) as question_count 
FROM examtracker 
WHERE category = 'GATE_CSE' 
GROUP BY topic 
ORDER BY question_count DESC;
