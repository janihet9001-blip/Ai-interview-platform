package com.interviewai.interview_platform.util;

import com.interviewai.interview_platform.model.QuestionBank;
import com.interviewai.interview_platform.model.QuestionBank.Difficulty;
import com.interviewai.interview_platform.repository.QuestionBankRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import java.util.List;

@Component
@RequiredArgsConstructor
public class QuestionSeeder implements CommandLineRunner {

    private final QuestionBankRepository questionBankRepository;

    @Override
    public void run(String... args) {

        // Only seed if table is empty
        if (questionBankRepository.count() > 0) return;

        List<QuestionBank> questions = List.of(

                // ── CORE JAVA ──
                q("What is the difference between JDK, JRE, and JVM?",
                        "JDK is development kit, JRE is runtime environment, JVM is virtual machine that runs bytecode.",
                        Difficulty.EASY, "Core Java", "JAVA_DEVELOPER"),

                q("What is the difference between == and .equals() in Java?",
                        "== compares references (memory address), .equals() compares actual content/values.",
                        Difficulty.EASY, "Core Java", "JAVA_DEVELOPER"),

                q("What is autoboxing and unboxing?",
                        "Autoboxing converts primitive to wrapper class automatically. Unboxing is the reverse.",
                        Difficulty.EASY, "Core Java", "JAVA_DEVELOPER"),

                q("What is the difference between String, StringBuilder, and StringBuffer?",
                        "String is immutable. StringBuilder is mutable but not thread-safe. StringBuffer is mutable and thread-safe.",
                        Difficulty.MEDIUM, "Core Java", "JAVA_DEVELOPER"),

                q("What are checked and unchecked exceptions?",
                        "Checked exceptions must be handled at compile time (IOException). Unchecked are runtime exceptions (NullPointerException).",
                        Difficulty.MEDIUM, "Core Java", "JAVA_DEVELOPER"),

                q("What is the difference between final, finally, and finalize?",
                        "final = constant/no override. finally = always runs in try-catch. finalize = called before garbage collection.",
                        Difficulty.MEDIUM, "Core Java", "JAVA_DEVELOPER"),

                q("What is a static keyword in Java?",
                        "static means the member belongs to the class, not instances. Shared across all objects.",
                        Difficulty.EASY, "Core Java", "JAVA_DEVELOPER"),

                q("What is the difference between abstract class and interface?",
                        "Abstract class can have state and method implementations. Interface is a pure contract. Java supports multiple interface implementation.",
                        Difficulty.MEDIUM, "Core Java", "JAVA_DEVELOPER"),

                q("What is method overloading vs method overriding?",
                        "Overloading = same name, different parameters (compile-time). Overriding = redefining parent method in child class (runtime).",
                        Difficulty.EASY, "Core Java", "JAVA_DEVELOPER"),

                q("Explain the concept of immutability in Java.",
                        "Immutable objects cannot be changed after creation. String is immutable. Use final fields and no setters to create immutable class.",
                        Difficulty.MEDIUM, "Core Java", "JAVA_DEVELOPER"),

                // ── OOP ──
                q("What are the four pillars of OOP?",
                        "Encapsulation, Inheritance, Polymorphism, and Abstraction.",
                        Difficulty.EASY, "OOP", "JAVA_DEVELOPER"),

                q("What is polymorphism? Give an example.",
                        "Polymorphism means one interface, many implementations. Runtime polymorphism via method overriding. Compile-time via overloading.",
                        Difficulty.EASY, "OOP", "JAVA_DEVELOPER"),

                q("What is encapsulation and why is it important?",
                        "Encapsulation hides internal state using private fields and provides access via getters/setters. Protects data integrity.",
                        Difficulty.EASY, "OOP", "JAVA_DEVELOPER"),

                q("What is the difference between IS-A and HAS-A relationships?",
                        "IS-A is inheritance (Dog IS-A Animal). HAS-A is composition (Car HAS-A Engine).",
                        Difficulty.MEDIUM, "OOP", "JAVA_DEVELOPER"),

                q("What is a design pattern? Name a few common ones.",
                        "Reusable solutions to common problems. Common: Singleton, Factory, Observer, Builder, Strategy, Decorator.",
                        Difficulty.MEDIUM, "OOP", "JAVA_DEVELOPER"),

                // ── COLLECTIONS ──
                q("What is the difference between ArrayList and LinkedList?",
                        "ArrayList uses dynamic array, fast random access O(1). LinkedList uses doubly linked list, fast insert/delete O(1) but slow access O(n).",
                        Difficulty.MEDIUM, "Collections", "JAVA_DEVELOPER"),

                q("What is the difference between HashMap and HashTable?",
                        "HashMap is not thread-safe and allows null keys/values. HashTable is synchronized and does not allow nulls.",
                        Difficulty.MEDIUM, "Collections", "JAVA_DEVELOPER"),

                q("What is the difference between HashMap and TreeMap?",
                        "HashMap has no ordering, O(1) operations. TreeMap maintains sorted order, O(log n) operations.",
                        Difficulty.MEDIUM, "Collections", "JAVA_DEVELOPER"),

                q("What is a Set in Java? Name its implementations.",
                        "Set stores unique elements. Implementations: HashSet (unordered), LinkedHashSet (insertion order), TreeSet (sorted).",
                        Difficulty.EASY, "Collections", "JAVA_DEVELOPER"),

                q("What is the difference between Iterator and ListIterator?",
                        "Iterator can traverse forward only. ListIterator can traverse both directions and modify elements.",
                        Difficulty.MEDIUM, "Collections", "JAVA_DEVELOPER"),

                q("What is ConcurrentHashMap and when to use it?",
                        "Thread-safe version of HashMap. Uses segment locking for better concurrency than HashTable.",
                        Difficulty.HARD, "Collections", "JAVA_DEVELOPER"),

                q("What is the Collections.sort() vs Arrays.sort()?",
                        "Collections.sort() sorts List using merge sort. Arrays.sort() sorts arrays using dual-pivot quicksort for primitives.",
                        Difficulty.MEDIUM, "Collections", "JAVA_DEVELOPER"),

                // ── JAVA 8+ ──
                q("What are lambda expressions in Java 8?",
                        "Anonymous functions that implement functional interfaces. Syntax: (params) -> expression. Reduces boilerplate code.",
                        Difficulty.MEDIUM, "Java 8", "JAVA_DEVELOPER"),

                q("What is the Stream API in Java 8?",
                        "Functional-style operations on collections. Supports filter, map, reduce, collect. Lazy evaluation and can be parallelized.",
                        Difficulty.MEDIUM, "Java 8", "JAVA_DEVELOPER"),

                q("What is Optional in Java 8 and why use it?",
                        "Container for possibly null values. Avoids NullPointerException. Methods: isPresent(), get(), orElse(), map().",
                        Difficulty.MEDIUM, "Java 8", "JAVA_DEVELOPER"),

                q("What is a functional interface?",
                        "Interface with exactly one abstract method. Annotated with @FunctionalInterface. Examples: Runnable, Comparator, Predicate.",
                        Difficulty.MEDIUM, "Java 8", "JAVA_DEVELOPER"),

                q("What are default methods in interfaces?",
                        "Methods with implementation in interfaces introduced in Java 8. Allow adding methods without breaking existing implementations.",
                        Difficulty.MEDIUM, "Java 8", "JAVA_DEVELOPER"),

                // ── MULTITHREADING ──
                q("What is the difference between Thread and Runnable?",
                        "Thread is a class that can be extended. Runnable is an interface that should be preferred as Java doesn't support multiple inheritance.",
                        Difficulty.MEDIUM, "Multithreading", "JAVA_DEVELOPER"),

                q("What is synchronization in Java?",
                        "Mechanism to control access to shared resources in multithreaded programs. Use synchronized keyword on methods or blocks.",
                        Difficulty.MEDIUM, "Multithreading", "JAVA_DEVELOPER"),

                q("What is a deadlock? How to prevent it?",
                        "Deadlock occurs when two threads wait for each other's locks forever. Prevent by consistent lock ordering and using tryLock().",
                        Difficulty.HARD, "Multithreading", "JAVA_DEVELOPER"),

                q("What is volatile keyword in Java?",
                        "Ensures variable is read from main memory, not thread's local cache. Guarantees visibility but not atomicity.",
                        Difficulty.HARD, "Multithreading", "JAVA_DEVELOPER"),

                // ── SPRING BOOT ──
                q("What is Spring Boot and what problem does it solve?",
                        "Spring Boot simplifies Spring development with auto-configuration, embedded servers, and starter dependencies. No XML config needed.",
                        Difficulty.EASY, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is Dependency Injection and why is it useful?",
                        "Design pattern where objects receive their dependencies from outside. Reduces coupling, improves testability and maintainability.",
                        Difficulty.MEDIUM, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is the difference between @Component, @Service, @Repository, @Controller?",
                        "All are Spring stereotypes. @Repository adds DB exception translation. @Service marks business logic. @Controller marks web layer.",
                        Difficulty.MEDIUM, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is @Autowired and how does it work?",
                        "Marks a dependency for automatic injection by Spring container. Can inject by type, name, or qualifier.",
                        Difficulty.EASY, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is the difference between @RestController and @Controller?",
                        "@RestController = @Controller + @ResponseBody. Automatically serializes return values to JSON.",
                        Difficulty.EASY, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is Spring Security and how does JWT work with it?",
                        "Spring Security handles authentication and authorization. JWT is stateless token passed in header, validated by filter before each request.",
                        Difficulty.HARD, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is JPA and Hibernate?",
                        "JPA is Java Persistence API specification. Hibernate is its most popular implementation. Maps Java objects to DB tables.",
                        Difficulty.MEDIUM, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is the difference between @GetMapping, @PostMapping, @PutMapping, @DeleteMapping?",
                        "HTTP method specific shortcuts for @RequestMapping. GET=read, POST=create, PUT=update, DELETE=delete.",
                        Difficulty.EASY, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is application.properties vs application.yml?",
                        "Both configure Spring Boot. application.properties is flat key=value. application.yml is hierarchical YAML format.",
                        Difficulty.EASY, "Spring Boot", "JAVA_DEVELOPER"),

                q("What is @Transactional annotation?",
                        "Marks method/class as transactional. Spring wraps in DB transaction, auto-commits on success, rolls back on exception.",
                        Difficulty.MEDIUM, "Spring Boot", "JAVA_DEVELOPER"),

                // ── DATABASE ──
                q("What is the difference between INNER JOIN and LEFT JOIN?",
                        "INNER JOIN returns matching rows from both tables. LEFT JOIN returns all rows from left table and matching from right.",
                        Difficulty.MEDIUM, "Database", "JAVA_DEVELOPER"),

                q("What is database indexing and why is it important?",
                        "Index is a data structure that speeds up data retrieval. Without index, full table scan. With index, B-tree lookup.",
                        Difficulty.MEDIUM, "Database", "JAVA_DEVELOPER"),

                q("What is ACID in databases?",
                        "Atomicity, Consistency, Isolation, Durability. Properties that guarantee reliable database transactions.",
                        Difficulty.MEDIUM, "Database", "JAVA_DEVELOPER"),

                q("What is the N+1 query problem in JPA?",
                        "Loading 1 parent entity triggers N additional queries for child entities. Fix with JOIN FETCH or @EntityGraph.",
                        Difficulty.HARD, "Database", "JAVA_DEVELOPER"),

                // ── MISC ──
                q("What is REST API? What are its principles?",
                        "Architectural style for APIs. Principles: stateless, client-server, cacheable, uniform interface, layered system.",
                        Difficulty.EASY, "REST", "JAVA_DEVELOPER"),

                q("What is the difference between PUT and PATCH?",
                        "PUT replaces entire resource. PATCH partially updates resource.",
                        Difficulty.EASY, "REST", "JAVA_DEVELOPER"),

                q("What is WebSocket and how is it different from HTTP?",
                        "WebSocket provides full-duplex communication. HTTP is request-response. WebSocket keeps connection open for real-time data.",
                        Difficulty.MEDIUM, "WebSocket", "JAVA_DEVELOPER"),

                q("What is Maven and what is pom.xml?",
                        "Maven is a build tool. pom.xml defines project dependencies, plugins, and build configuration.",
                        Difficulty.EASY, "Tools", "JAVA_DEVELOPER"),

                q("What is Git and what is the difference between merge and rebase?",
                        "Git is version control. Merge combines branches preserving history. Rebase rewrites commits on top of another branch for cleaner history.",
                        Difficulty.MEDIUM, "Tools", "JAVA_DEVELOPER"),

                q("What is the difference between microservices and monolithic architecture?",
                        "Monolithic = one large application. Microservices = small independent services. Microservices are scalable but more complex.",
                        Difficulty.HARD, "Architecture", "JAVA_DEVELOPER")
        );

        questionBankRepository.saveAll(questions);
        System.out.println("Question bank seeded with " + questions.size() + " questions!");
    }

    private QuestionBank q(String question, String answer,
                           Difficulty difficulty, String category, String role) {
        QuestionBank q = new QuestionBank();
        q.setQuestionText(question);
        q.setExpectedAnswer(answer);
        q.setDifficulty(difficulty);
        q.setCategory(category);
        q.setJobRole(role);
        return q;
    }
}