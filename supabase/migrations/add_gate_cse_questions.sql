-- Add GATE CSE Questions to examtracker table
-- Run this script in your Supabase SQL Editor after creating the main tables

-- =====================================================
-- STEP 1: Check if examtracker table exists
-- =====================================================

-- Verify examtracker table exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'examtracker';

-- =====================================================
-- STEP 2: Check existing GATE CSE questions
-- =====================================================

-- Check if GATE CSE questions already exist
SELECT COUNT(*) as existing_gate_questions 
FROM examtracker 
WHERE category = 'GATE_CSE';

-- =====================================================
-- STEP 3: Insert GATE CSE questions
-- =====================================================

-- Insert comprehensive GATE CSE questions
INSERT INTO examtracker (category, question, options_A, options_B, options_C, options_D, correct_option, solution, topic, difficulty) VALUES

-- =====================================================
-- ALGORITHMS (6 questions)
-- =====================================================
('GATE_CSE', 'What is the time complexity of binary search algorithm?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'B', 'Binary search has logarithmic time complexity as it divides the search space in half at each step.', 'Algorithms', 'medium'),

('GATE_CSE', 'Which sorting algorithm has the best average-case time complexity?', 'Bubble Sort', 'Quick Sort', 'Selection Sort', 'Insertion Sort', 'B', 'Quick Sort has O(n log n) average-case time complexity.', 'Algorithms', 'hard'),

('GATE_CSE', 'What is the space complexity of merge sort?', 'O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'C', 'Merge sort requires additional space proportional to the input size.', 'Algorithms', 'medium'),

('GATE_CSE', 'Which algorithm is used to find the shortest path in a weighted graph?', 'Breadth First Search', 'Depth First Search', 'Dijkstra''s Algorithm', 'Binary Search', 'C', 'Dijkstra''s algorithm is specifically designed for finding shortest paths in weighted graphs.', 'Algorithms', 'hard'),

('GATE_CSE', 'What is the time complexity of inserting an element in a binary search tree?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'B', 'In a balanced BST, insertion takes O(log n) time.', 'Algorithms', 'medium'),

('GATE_CSE', 'Which data structure is best for implementing a priority queue?', 'Array', 'Linked List', 'Heap', 'Stack', 'C', 'Heap provides efficient insertion and deletion of highest priority element.', 'Algorithms', 'medium'),

-- =====================================================
-- PROGRAMMING & DATA STRUCTURES (6 questions)
-- =====================================================
('GATE_CSE', 'Which of the following is NOT a valid data structure?', 'Stack', 'Queue', 'Tree', 'Loop', 'D', 'Loop is a control structure, not a data structure.', 'Programming & Data Structures', 'easy'),

('GATE_CSE', 'What is the time complexity of inserting an element at the beginning of an array?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'C', 'All elements need to be shifted to make space for the new element.', 'Programming & Data Structures', 'medium'),

('GATE_CSE', 'What is the output of the following C code?<br>int x = 5;<br>printf("%d", x++);', '4', '5', '6', 'Undefined', 'B', 'Post-increment operator returns the original value before incrementing.', 'Programming & Data Structures', 'medium'),

('GATE_CSE', 'Which of the following is a linear data structure?', 'Tree', 'Graph', 'Stack', 'Heap', 'C', 'Stack is a linear data structure where elements are arranged in a sequence.', 'Programming & Data Structures', 'easy'),

('GATE_CSE', 'What is the time complexity of searching in a hash table?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'A', 'Hash table provides average O(1) time complexity for search operations.', 'Programming & Data Structures', 'medium'),

('GATE_CSE', 'Which traversal visits root, left subtree, then right subtree?', 'Inorder', 'Preorder', 'Postorder', 'Level order', 'B', 'Preorder traversal visits root first, then left subtree, then right subtree.', 'Programming & Data Structures', 'medium'),

-- =====================================================
-- OPERATING SYSTEMS (4 questions)
-- =====================================================
('GATE_CSE', 'Which scheduling algorithm is preemptive?', 'First Come First Serve', 'Shortest Job First', 'Round Robin', 'All of the above', 'C', 'Round Robin is preemptive as it uses time quantum to switch between processes.', 'Operating Systems', 'medium'),

('GATE_CSE', 'What is the main purpose of virtual memory?', 'Increase RAM speed', 'Allow programs to use more memory than physically available', 'Reduce CPU usage', 'Improve disk performance', 'B', 'Virtual memory allows programs to use more memory than physically available by using disk space.', 'Operating Systems', 'medium'),

('GATE_CSE', 'Which of the following is a synchronization primitive?', 'Semaphore', 'Array', 'Queue', 'Stack', 'A', 'Semaphore is a synchronization primitive used to control access to shared resources.', 'Operating Systems', 'medium'),

('GATE_CSE', 'What is the main function of an operating system?', 'Manage hardware resources', 'Run applications', 'Provide user interface', 'All of the above', 'D', 'Operating system manages hardware resources, runs applications, and provides user interface.', 'Operating Systems', 'easy'),

-- =====================================================
-- DISCRETE MATHEMATICS & GRAPH THEORY (4 questions)
-- =====================================================
('GATE_CSE', 'What is the maximum number of edges in a graph with n vertices?', 'n', 'n-1', 'n(n-1)/2', 'n²', 'C', 'In a complete graph, each vertex connects to every other vertex.', 'Discrete Mathematics & Graph Theory', 'easy'),

('GATE_CSE', 'How many different binary trees can be formed with 3 nodes?', '3', '5', '7', '9', 'B', 'There are 5 different binary tree structures possible with 3 nodes.', 'Discrete Mathematics & Graph Theory', 'medium'),

('GATE_CSE', 'What is the chromatic number of a complete graph with n vertices?', '1', '2', 'n', 'n-1', 'C', 'A complete graph with n vertices requires n colors as each vertex connects to every other vertex.', 'Discrete Mathematics & Graph Theory', 'medium'),

('GATE_CSE', 'Which of the following is a valid propositional logic formula?', 'p AND q', 'p + q', 'p * q', 'p / q', 'A', 'p AND q is a valid propositional logic formula.', 'Discrete Mathematics & Graph Theory', 'easy'),

-- =====================================================
-- COMPUTER NETWORKS (3 questions)
-- =====================================================
('GATE_CSE', 'Which protocol operates at the transport layer?', 'HTTP', 'TCP', 'IP', 'ARP', 'B', 'TCP (Transmission Control Protocol) operates at the transport layer.', 'Computer Networks', 'medium'),

('GATE_CSE', 'What is the default port number for HTTP?', '80', '443', '8080', '21', 'A', 'HTTP uses port 80 by default.', 'Computer Networks', 'easy'),

('GATE_CSE', 'Which network topology provides the highest reliability?', 'Bus', 'Star', 'Ring', 'Mesh', 'D', 'Mesh topology provides the highest reliability as each node connects to every other node.', 'Computer Networks', 'medium'),

-- =====================================================
-- DATABASE MANAGEMENT SYSTEMS (3 questions)
-- =====================================================
('GATE_CSE', 'Which normal form eliminates transitive dependencies?', '1NF', '2NF', '3NF', 'BCNF', 'C', 'Third Normal Form (3NF) eliminates transitive dependencies.', 'DBMS', 'medium'),

('GATE_CSE', 'What is ACID in database systems?', 'Atomicity, Consistency, Isolation, Durability', 'Availability, Consistency, Integrity, Durability', 'Atomicity, Consistency, Integrity, Durability', 'Availability, Consistency, Isolation, Durability', 'A', 'ACID stands for Atomicity, Consistency, Isolation, Durability.', 'DBMS', 'medium'),

('GATE_CSE', 'Which SQL command is used to modify existing data?', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'B', 'UPDATE command is used to modify existing data in a table.', 'DBMS', 'easy'),

-- =====================================================
-- THEORY OF COMPUTATION (3 questions)
-- =====================================================
('GATE_CSE', 'Which of the following is a regular language?', 'a^n b^n | n ≥ 0', 'a^n b^n c^n | n ≥ 0', 'a^n b^m | n, m ≥ 0', 'a^n b^n c^m | n, m ≥ 0', 'C', 'a^n b^m is a regular language as it can be recognized by a finite automaton.', 'Theory of Computation', 'hard'),

('GATE_CSE', 'What type of grammar is most restrictive?', 'Type 0', 'Type 1', 'Type 2', 'Type 3', 'D', 'Type 3 (Regular Grammar) is the most restrictive.', 'Theory of Computation', 'medium'),

('GATE_CSE', 'Which machine can recognize context-free languages?', 'Finite Automaton', 'Pushdown Automaton', 'Turing Machine', 'Linear Bounded Automaton', 'B', 'Pushdown Automaton can recognize context-free languages.', 'Theory of Computation', 'medium'),

-- =====================================================
-- COMPUTER ORGANIZATION (3 questions)
-- =====================================================
('GATE_CSE', 'What is the function of ALU in CPU?', 'Control unit operations', 'Arithmetic and logical operations', 'Memory management', 'Input/output operations', 'B', 'ALU (Arithmetic Logic Unit) performs arithmetic and logical operations.', 'Computer Organization', 'easy'),

('GATE_CSE', 'Which memory is fastest?', 'Hard Disk', 'RAM', 'Cache', 'ROM', 'C', 'Cache memory is the fastest among the given options.', 'Computer Organization', 'medium'),

('GATE_CSE', 'What is the main function of the control unit?', 'Perform calculations', 'Manage memory', 'Coordinate and control other units', 'Handle input/output', 'C', 'Control unit coordinates and controls other units of the CPU.', 'Computer Organization', 'medium'),

-- =====================================================
-- DIGITAL LOGIC (3 questions)
-- =====================================================
('GATE_CSE', 'What is the output of AND gate if both inputs are 1?', '0', '1', 'Undefined', 'Depends on gate type', 'B', 'AND gate outputs 1 only when both inputs are 1.', 'Digital Logic', 'easy'),

('GATE_CSE', 'How many inputs does a full adder have?', '2', '3', '4', '5', 'B', 'A full adder has 3 inputs: A, B, and carry-in.', 'Digital Logic', 'medium'),

('GATE_CSE', 'Which logic gate implements the NAND function?', 'AND + NOT', 'OR + NOT', 'XOR + NOT', 'XNOR + NOT', 'A', 'NAND is implemented as AND followed by NOT.', 'Digital Logic', 'medium'),

-- =====================================================
-- COMPILER DESIGN (3 questions)
-- =====================================================
('GATE_CSE', 'Which phase of compiler comes first?', 'Lexical Analysis', 'Syntax Analysis', 'Semantic Analysis', 'Code Generation', 'A', 'Lexical Analysis is the first phase of compilation.', 'Compiler Design', 'medium'),

('GATE_CSE', 'What is the output of lexical analyzer?', 'Tokens', 'Parse Tree', 'Abstract Syntax Tree', 'Machine Code', 'A', 'Lexical analyzer produces tokens as output.', 'Compiler Design', 'medium'),

('GATE_CSE', 'Which parsing technique is top-down?', 'LR parsing', 'LL parsing', 'SLR parsing', 'LALR parsing', 'B', 'LL parsing is a top-down parsing technique.', 'Compiler Design', 'medium'),

-- =====================================================
-- SOFTWARE ENGINEERING (2 questions)
-- =====================================================
('GATE_CSE', 'Which software development model is iterative?', 'Waterfall', 'Spiral', 'V-Model', 'Big Bang', 'B', 'Spiral model is iterative and incremental.', 'Software Engineering', 'medium'),

('GATE_CSE', 'What is the main purpose of unit testing?', 'Test the entire system', 'Test individual components', 'Test user interface', 'Test database', 'B', 'Unit testing focuses on testing individual components or units.', 'Software Engineering', 'easy')

ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 4: Verify the insertion
-- =====================================================

-- Count total GATE CSE questions
SELECT COUNT(*) as total_gate_questions 
FROM examtracker 
WHERE category = 'GATE_CSE';

-- Show questions by topic
SELECT topic, COUNT(*) as question_count 
FROM examtracker 
WHERE category = 'GATE_CSE' 
GROUP BY topic 
ORDER BY question_count DESC;

-- Show questions by difficulty
SELECT difficulty, COUNT(*) as question_count 
FROM examtracker 
WHERE category = 'GATE_CSE' 
GROUP BY difficulty 
ORDER BY question_count DESC;

-- Show sample questions
SELECT id, question, topic, difficulty 
FROM examtracker 
WHERE category = 'GATE_CSE' 
ORDER BY topic, difficulty 
LIMIT 10;

-- =====================================================
-- STEP 5: Final verification
-- =====================================================

SELECT 'GATE CSE questions added successfully!' as status;


































