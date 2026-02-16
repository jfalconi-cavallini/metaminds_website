export const siteData = {
    brand: {
        name: "MetaMinds STEM Academy",
        location: "DFW Metroplex",
        email: "hello@metamindsstem.com",
        tagline: "Where Future Engineers Are Built",
        description: "Hands-on robotics and engineering summer camps for ages 6-14 in the DFW area.",
    },

    hero: {
        headline: "Build. Code. Compete.",
        subheadline: "DFW's premier robotics summer camp where kids design real robots, solve engineering challenges, and compete in epic tournaments.",
        cta1: "Reserve a Spot",
        cta2: "View Summer Weeks",
        formUrl: "https://form.jotform.com/YOUR_FORM_ID",
    },

    trustBar: [
        "Ages 6–14",
        "9 Summer Weeks",
        "Small Groups (8:1 ratio)",
        "No Experience Needed",
    ],

    tracks: [
        {
            id: "explorers",
            name: "Explorers Division",
            ageRange: "Ages 6–8",
            description:
                "A hands-on introduction to robotics, engineering fundamentals, and scientific discovery through guided builds, coding basics, and structured team challenges.",
            highlights: [
                "Foundations of simple machines",
                "Introductory coding logic & sensors",
                "Collaborative robotics builds",
                "Division-based mini tournaments",
            ],
        },
        {
            id: "builders",
            name: "Builders Division",
            ageRange: "Ages 9–11",
            description:
                "Students design, construct, and refine robotics systems while learning mechanical engineering principles, structured problem-solving, and competitive strategy.",
            highlights: [
                "Gear ratios & drivetrain systems",
                "Structural design & load testing",
                "Coding for controlled robotics systems",
                "Weekly division tournaments",
            ],
        },
        {
            id: "elite",
            name: "Elite Robotics Division",
            ageRange: "Ages 12–14",
            description:
                "An advanced engineering experience focused on autonomous robotics, AI logic, sensor integration, and high-level competitive performance.",
            highlights: [
                "Autonomous programming & sensor fusion",
                "AI-driven decision systems",
                "Strategic robot optimization",
                "Elite tournament bracket competition",
            ],
        },
    ],


    schedule: [
        { time: "9:00 AM", activity: "Welcome + Mini Challenge" },
        { time: "9:30 AM", activity: "Build Session" },
        { time: "11:00 AM", activity: "Coding + Testing" },
        { time: "12:00 PM", activity: "Lunch Break" },
        { time: "12:45 PM", activity: "Team Challenge" },
        { time: "2:00 PM", activity: "Competition / Tournament" },
        { time: "2:45 PM", activity: "Showcase + Wrap-up" },
        { time: "3:00 PM", activity: "Pickup" },
    ],

    campWeeks: [
        {
            dates: "May 25–29",
            status: "available",
            theme: "Robot Battle Royale",
            description: "Design combat robots for the ultimate tournament showdown"
        },
        {
            dates: "June 1–5",
            status: "available",
            theme: "Drone Racing League",
            description: "Build and race autonomous drones through obstacle courses"
        },
        {
            dates: "June 8–12",
            status: "available",
            theme: "Underwater Explorers",
            description: "Create submersible robots for deep-sea missions"
        },
        {
            dates: "June 15–19",
            status: "available",
            theme: "Robot Restaurant",
            description: "Engineer a fully automated robot kitchen and delivery system"
        },
        {
            dates: "June 22–26",
            status: "available",
            theme: "Superhero Tech Lab",
            description: "Build gadgets and robots inspired by your favorite heroes"
        },
        {
            dates: "June 29–July 3",
            status: "available",
            theme: "Zombie Apocalypse Survival",
            description: "Create defense robots and automated survival systems"
        },
        {
            dates: "July 6–10",
            status: "available",
            theme: "Treasure Hunter Bots",
            description: "Design robots that search, map, and recover hidden treasures"
        },
        {
            dates: "July 13–17",
            status: "available",
            theme: "Animal Kingdom Robots",
            description: "Build biomimetic robots inspired by nature's best designs"
        },
        {
            dates: "July 20–24",
            status: "available",
            theme: "Time Travel Engineers",
            description: "Create robots from different eras: ancient, medieval, future"
        },
        {
            dates: "July 27–31",
            status: "available",
            theme: "Robot Olympics",
            description: "Train robots for extreme sports and athletic competitions"
        },
        {
            dates: "August 3–7",
            status: "available",
            theme: "Spy Tech & Secret Agents",
            description: "Build surveillance bots, code-breaking systems, and stealth tech"
        },
        {
            dates: "August 10–14",
            status: "available",
            theme: "Alien Invasion Defense",
            description: "Engineer planetary defense systems and alien contact robots"
        },
    ],

    themes: [
        {
            name: "Robot Battle Royale",
            weekDates: "May 25–29",
            description: "Welcome to the arena! Design offensive and defensive mechanisms, strategic AI, and battle-tested armor. Build your champion bot and compete in daily elimination rounds leading to the ultimate Friday championship.",
            icon: "⚔️",
            skills: ["Combat Mechanics", "Strategic AI", "Armor Design", "Tournament Strategy"],
            projects: ["Spinner Bot", "Flipper Mechanism", "Wedge Warrior"],
            highlight: "Friday Tournament with Championship Belt!",
        },
        {
            name: "Drone Racing League",
            weekDates: "June 1–5",
            description: "Experience the thrill of high-speed robotics! Build drones with precision controls, obstacle avoidance sensors, and speed optimization. Race through custom courses with loops, gates, and challenges.",
            icon: "🚁",
            skills: ["Flight Dynamics", "Speed Optimization", "Obstacle Detection", "Precision Control"],
            projects: ["Racing Quadcopter", "Obstacle Course", "Time Trial System"],
            highlight: "Live drone racing championship with FPV cameras!",
        },
        {
            name: "Underwater Explorers",
            weekDates: "June 8–12",
            description: "Dive deep into robotics! Create waterproof robots that can navigate underwater, collect samples, and explore aquatic environments. Learn about buoyancy, propulsion, and remote underwater operations.",
            icon: "🌊",
            skills: ["Waterproofing", "Buoyancy Control", "Underwater Navigation", "Sample Collection"],
            projects: ["Submarine Bot", "Treasure Retriever", "Deep Sea Explorer"],
            highlight: "Pool testing day with underwater challenges!",
        },
        {
            name: "Robot Restaurant",
            weekDates: "June 15–19",
            description: "Open for business! Design an entire automated restaurant system—from robot chefs to delivery drones to automated cashiers. Learn about conveyor systems, sorting algorithms, and customer service AI.",
            icon: "🍕",
            skills: ["Automation Systems", "Conveyor Design", "Sorting Algorithms", "Service Robotics"],
            projects: ["Chef Bot Arm", "Delivery Robot", "Order System"],
            highlight: "Parent showcase with working robot restaurant!",
        },
        {
            name: "Superhero Tech Lab",
            weekDates: "June 22–26",
            description: "Every hero needs gadgets! Build Iron Man's suit components, Spider-Man's web shooters, Batman's grappling hooks, and more. Combine engineering with imagination to create functioning superhero technology.",
            icon: "🦸",
            skills: ["Gadget Engineering", "Wearable Tech", "Mechanism Design", "Comic Book Physics"],
            projects: ["Power Glove", "Grappling System", "Jetpack Prototype"],
            highlight: "Superhero showcase day—costumes encouraged!",
        },
        {
            name: "Zombie Apocalypse Survival",
            weekDates: "June 29–July 3",
            description: "Survive the outbreak! Build perimeter defense robots, automated alert systems, supply delivery drones, and barricade mechanisms. Strategy meets engineering in this action-packed survival challenge.",
            icon: "🧟",
            skills: ["Defense Systems", "Perimeter Security", "Threat Detection", "Supply Management"],
            projects: ["Guard Bot", "Alert System", "Supply Drone"],
            highlight: "Zombie invasion simulation finale!",
        },
        {
            name: "Treasure Hunter Bots",
            weekDates: "July 6–10",
            description: "X marks the spot! Create robots that can read maps, navigate terrain, detect buried objects, and retrieve treasures. Learn about GPS, metal detection, mapping algorithms, and excavation tools.",
            icon: "🗺️",
            skills: ["Navigation Systems", "Object Detection", "Mapping", "Excavation Tools"],
            projects: ["Explorer Bot", "Detector System", "Retrieval Arm"],
            highlight: "Real treasure hunt with buried prizes!",
        },
        {
            name: "Animal Kingdom Robots",
            weekDates: "July 13–17",
            description: "Nature's greatest inventions! Build robots inspired by animals—flying like birds, swimming like fish, crawling like insects, and climbing like geckos. Discover how biology inspires the best robotics.",
            icon: "🦎",
            skills: ["Biomimicry", "Natural Motion", "Adaptive Systems", "Multi-Terrain Movement"],
            projects: ["Bird Bot", "Snake Robot", "Climbing Spider"],
            highlight: "Nature vs. Machine competition!",
        },
        {
            name: "Time Travel Engineers",
            weekDates: "July 20–24",
            description: "Build through the ages! Create ancient catapults, medieval siege weapons, steampunk contraptions, and futuristic tech. Learn how engineering evolved and imagine what comes next.",
            icon: "⏰",
            skills: ["Historical Engineering", "Evolution of Tech", "Steampunk Design", "Future Prediction"],
            projects: ["Catapult", "Mechanical Clock", "Hovercraft"],
            highlight: "Time period competition across eras!",
        },
        {
            name: "Robot Olympics",
            weekDates: "July 27–31",
            description: "Go for the gold! Train robots for extreme competitions—long jump, sprint races, weightlifting, gymnastics, and more. Optimize for speed, power, precision, and endurance.",
            icon: "🏆",
            skills: ["Performance Optimization", "Speed Tuning", "Power Systems", "Precision Engineering"],
            projects: ["Sprint Bot", "Jumping Robot", "Weightlifter"],
            highlight: "Olympic-style medal ceremony!",
        },
        {
            name: "Spy Tech & Secret Agents",
            weekDates: "August 3–7",
            description: "Mission accepted! Build surveillance drones, code-breaking computers, laser security systems, and stealth robots. Learn about encryption, sensors, and covert operations technology.",
            icon: "🕵️",
            skills: ["Stealth Technology", "Surveillance Systems", "Encryption", "Covert Operations"],
            projects: ["Spy Drone", "Security System", "Code Breaker"],
            highlight: "Secret mission finale with parents as targets!",
        },
        {
            name: "Alien Invasion Defense",
            weekDates: "August 10–14",
            description: "Protect Earth! Design planetary defense systems, alien communication devices, UFO interceptors, and first-contact protocols. The fate of humanity depends on your engineering skills!",
            icon: "👽",
            skills: ["Defense Strategy", "Communication Systems", "Interception Tech", "First Contact Protocol"],
            projects: ["Defense Turret", "Scanner System", "Interceptor Bot"],
            highlight: "Alien invasion simulation battle!",
        },
    ],

    pricing: {
        basePrice: "$495",
        priceLabel: "per week",
        siblingDiscount: "Sibling discount available",
        note: "Limited seats per week. Reserve early.",
    },

    faqs: [
        {
            question: "Do kids need prior experience?",
            answer: "Not at all! Our program is designed for beginners through advanced students. We group kids by age and skill level, and our instructors adapt activities to meet each child where they are.",
        },
        {
            question: "What will my child build?",
            answer: "Kids build functioning robots using VEX IQ and VEX V5 systems. Projects range from sensor-equipped rovers to competition-ready battlebots, depending on their track. Every student takes home photos and videos of their creations.",
        },
        {
            question: "What's the instructor-to-student ratio?",
            answer: "We maintain a maximum 8:1 ratio to ensure personalized attention. Each group has a lead instructor plus assistants, all experienced in robotics and education.",
        },
        {
            question: "What should my child bring?",
            answer: "Just a lunch, water bottle, and enthusiasm! We provide all robotics equipment, laptops, safety gear, and materials. Closed-toe shoes required.",
        },
        {
            question: "Where is camp located?",
            answer: "📍North Fort Worth (Colleville / Grapevine / Southlake) Final venue secured by April 15. All familiies notified immediately upon confirmation.",
        },
        {
            question: "What's your refund and transfer policy?",
            answer: "Full refund if canceled 14+ days before camp start. Within 14 days, receive a credit for a future week. We're flexible with transfers between weeks based on availability.",
        },
    ],

    cta: {
        headline: "Ready to Launch?",
        subheadline: "Spots fill fast. Reserve your child's week today.",
        buttonText: "Reserve Your Spot",
    },

    nav: [
        { label: "Founders", href: "#founders" },
        { label: "Programs", href: "#programs" },
        { label: "Gallery", href: "#gallery" },
        { label: "Schedule", href: "#schedule" },
        { label: "Weeks", href: "#weeks" },
        { label: "Pricing", href: "#pricing" },
        { label: "FAQ", href: "#faq" },
    ],

    founders: [
        {
            name: "Jose Falconi",
            title: "Co-Founder & Lead Instructor",
            image: "/images/jose.jpg",
            credentials: [
                "B.S. Computer Science, UC San Diego",
                "7+ years teaching experience",
                "College-level instructor",
                "Revolution Prep educator",
                "3+ years running robotics summer camps",
            ],
            bio: "Passionate about making STEM accessible and exciting for young minds through hands-on learning and real-world engineering challenges.",
        },
        {
            name: "Emma Brugman",
            title: "Co-Founder & Curriculum Director",
            image: "/images/emma.png",
            credentials: [
                "B.S. Cognitive & Neuroscience, UC San Diego",
                "M.S. Molecular Software Engineering, UC Berkeley",
                "STEM education specialist",
                "Curriculum development expert",
            ],
            bio: "Combining neuroscience and engineering to create learning experiences that truly resonate with how young minds develop and grow.",
        },
    ],

    gallery: {
        title: "See Us in Action",
        subtitle: "Real moments from our camps—building, competing, and celebrating together.",
        images: [
            {
                src: "/images/gallery/camp1.jpg",
                alt: "Students building robots",
                caption: "Team collaboration during build session",
            },
            {
                src: "/images/gallery/camp2.jpg",
                alt: "Robot competition",
                caption: "Tournament day excitement",
            },
            {
                src: "/images/gallery/camp3.jpg",
                alt: "Coding session",
                caption: "Learning autonomous programming",
            },
            {
                src: "/images/gallery/camp4.jpg",
                alt: "Group photo",
                caption: "Week 3 graduates celebrating",
            },
            {
                src: "/images/gallery/camp5.jpg",
                alt: "Robot showcase",
                caption: "Final showcase presentations",
            },
            {
                src: "/images/gallery/camp6.jpg",
                alt: "Instructors helping",
                caption: "One-on-one instruction",
            },
            {
                src: "/images/gallery/camp7.jpg",
                alt: "Group photo",
                caption: "Week 3 graduates celebrating",
            },
            {
                src: "/images/gallery/camp8.jpg",
                alt: "Robot showcase",
                caption: "Final showcase presentations",
            },
            {
                src: "/images/gallery/camp9.jpg",
                alt: "Instructors helping",
                caption: "One-on-one instruction",
            },


        ],
    },
};