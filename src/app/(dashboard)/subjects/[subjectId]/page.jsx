'use client';

import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    BookOpen,
    Map,
    CheckCircle2,
    Clock,
    FileText,
    PlayCircle
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

// Mock Data for Syllabus
const syllabusData = {
    "class9-math": {
        title: "Class 9 Mathematics",
        description: "Comprehensive coverage of Number Systems, Algebra, Geometry, and Mensuration.",
        chapters: [
            {
                title: "Number Systems",
                topics: ["Irrational Numbers", "Real Numbers and their Decimal Expansions", "Operations on Real Numbers", "Laws of Exponents for Real Numbers"],
                duration: "12 Hours",
                status: "Completed"
            },
            {
                title: "Polynomials",
                topics: ["Polynomials in One Variable", "Zeroes of a Polynomial", "Remainder Theorem", "Factorisation of Polynomials", "Algebraic Identities"],
                duration: "15 Hours",
                status: "In Progress"
            },
            {
                title: "Coordinate Geometry",
                topics: ["Cartesian System", "Plotting a Point in the Plane if its Coordinates are given"],
                duration: "8 Hours",
                status: "Locked"
            },
            {
                title: "Linear Equations in Two Variables",
                topics: ["Linear Equations", "Solution of a Linear Equation", "Graph of a Linear Equation in Two Variables"],
                duration: "10 Hours",
                status: "Locked"
            },
            {
                title: "Introduction to Euclid's Geometry",
                topics: ["Euclid's Definitions, Axioms and Postulates", "Equivalent Versions of Euclid's Fifth Postulate"],
                duration: "6 Hours",
                status: "Locked"
            },
            {
                title: "Lines and Angles",
                topics: ["Basic Terms and Definitions", "Intersecting Lines and Non-intersecting Lines", "Pairs of Angles", "Parallel Lines and a Transversal", "Lines Parallel to the Same Line", "Angle Sum Property of a Triangle"],
                duration: "14 Hours",
                status: "Locked"
            },
            {
                title: "Triangles",
                topics: ["Congruence of Triangles", "Criteria for Congruence of Triangles", "Some Properties of a Triangle", "Inequalities in a Triangle"],
                duration: "15 Hours",
                status: "Locked"
            },
            {
                title: "Quadrilaterals",
                topics: ["Angle Sum Property of a Quadrilateral", "Types of Quadrilaterals", "Properties of a Parallelogram", "The Mid-point Theorem"],
                duration: "12 Hours",
                status: "Locked"
            },
            {
                title: "Circles",
                topics: ["Circles and its Related Terms: A Review", "Angle Subtended by a Chord at a Point", "Perpendicular from the Centre to a Chord", "Circle through Three Points", "Equal Chords and their Distances from the Centre", "Angle Subtended by an Arc of a Circle", "Cyclic Quadrilaterals"],
                duration: "15 Hours",
                status: "Locked"
            },
            {
                title: "Heron’s Formula",
                topics: ["Area of a Triangle – by Heron’s Formula", "Application of Heron’s Formula in finding Areas of Quadrilaterals"],
                duration: "6 Hours",
                status: "Locked"
            },
            {
                title: "Surface Areas and Volumes",
                topics: ["Surface Area of a Cuboid and a Cube", "Surface Area of a Right Circular Cylinder", "Surface Area of a Right Circular Cone", "Surface Area of a Sphere", "Volume of a Cuboid", "Volume of a Cylinder", "Volume of a Cone", "Volume of a Sphere"],
                duration: "18 Hours",
                status: "Locked"
            },
            {
                title: "Statistics",
                topics: ["Collection of Data", "Presentation of Data", "Graphical Representation of Data", "Measures of Central Tendency"],
                duration: "10 Hours",
                status: "Locked"
            },
            {
                title: "Probability",
                topics: ["Probability – an Experimental Approach"],
                duration: "8 Hours",
                status: "Locked"
            }
        ]
    },
    "class9-science": {
        title: "Class 9 Science",
        description: "Explore the fundamental concepts of Matter, Life, Motion, and Natural Resources.",
        chapters: [
            {
                title: "Motion",
                topics: ["Distance and Displacement", "Speed and Velocity", "Acceleration", "Graphical Representation of Motion (v-t, s-t graphs)", "Equations of Motion by Graphical Method"],
                duration: "12 Hours",
                status: "Not Started"
            },
            {
                title: "Force and Laws of Motion",
                topics: ["Newton's First Law of Motion (Inertia)", "Newton's Second Law of Motion", "Newton's Third Law of Motion", "Momentum", "Conservation of Momentum"],
                duration: "14 Hours",
                status: "Not Started"
            },
            {
                title: "Gravitation",
                topics: ["Universal Law of Gravitation", "Free Fall", "Mass and Weight", "Thrust and Pressure", "Archimedes' Principle", "Buoyancy"],
                duration: "15 Hours",
                status: "Not Started"
            },
            {
                title: "Work and Energy",
                topics: ["Work Done by a Force", "Kinetic Energy", "Potential Energy", "Law of Conservation of Energy", "Power"],
                duration: "12 Hours",
                status: "Not Started"
            },
            {
                title: "Sound",
                topics: ["Nature of Sound", "Wave Parameters (Wavelength, Frequency, Amplitude)", "Speed of Sound", "Reflection of Sound", "Echo and Reverberation", "Structure of the Human Ear"],
                duration: "10 Hours",
                status: "Not Started"
            },
            {
                title: "Structure of the Atom",
                topics: ["Atomic Models (Thomson's, Rutherford's, Bohr's)", "Protons, Neutrons, and Electrons", "Valency", "Atomic Number and Mass Number", "Isotopes and Isobars"],
                duration: "12 Hours",
                status: "Not Started"
            },
            {
                title: "Tissues",
                topics: ["Plant Tissues (Meristematic and Permanent)", "Animal Tissues (Epithelial, Connective, Muscular, Nervous)"],
                duration: "10 Hours",
                status: "Not Started"
            },
            {
                title: "Diversity in Living Organisms",
                topics: ["Classification System", "Hierarchy of Classification", "Five Kingdoms (Monera, Protista, Fungi, Plantae, Animalia)", "Plant and Animal Phyla"],
                duration: "14 Hours",
                status: "Not Started"
            },
            {
                title: "Why Do We Fall Ill",
                topics: ["Health and Disease", "Infectious Diseases", "Non-infectious Diseases", "Means of Spread of Diseases", "Prevention and Treatment"],
                duration: "8 Hours",
                status: "Not Started"
            },
            {
                title: "Natural Resources",
                topics: ["Air, Water, and Soil", "Biogeochemical Cycles (Water, Nitrogen, Carbon, Oxygen)", "Ozone Layer and its Depletion"],
                duration: "10 Hours",
                status: "Not Started"
            },
            {
                title: "Improvement in Food Resources",
                topics: ["Crop Improvement", "Manure and Fertilizers", "Crop Production Management", "Animal Husbandry", "Bee Keeping"],
                duration: "10 Hours",
                status: "Not Started"
            }
        ]
    },
    "class10-math": {
        title: "Class 10 Mathematics",
        description: "Comprehensive coverage of Number Systems, Algebra, Geometry, and Mensuration tailored for Class 10 students.",
        chapters: [
            {
                title: "Real Numbers",
                topics: ["Euclid's Division Lemma", "Fundamental Theorem of Arithmetic", "HCF & LCM", "Irrational Numbers", "Decimal Expansions"],
                duration: "12 Hours"
            },
            {
                title: "Polynomials",
                topics: ["Zeros of a Polynomial", "Relationship between Zeros and Coefficients", "Graphical Interpretation", "Division Algorithm for Polynomials"],
                duration: "15 Hours"
            },
            {
                title: "Pair of Linear Equations in Two Variables",
                topics: ["Graphical Method of Solution", "Substitution Method", "Elimination Method", "Cross-Multiplication Method", "Consistency of Solutions"],
                duration: "14 Hours"
            },
            {
                title: "Quadratic Equations",
                topics: ["Solution by Factorization", "Completing the Square", "Quadratic Formula", "Nature of Roots (Discriminant)"],
                duration: "12 Hours"
            },
            {
                title: "Arithmetic Progressions",
                topics: ["nth Term of an AP", "Sum of First n Terms", "Real-life Applications"],
                duration: "10 Hours"
            },
            {
                title: "Triangles",
                topics: ["Similar Triangles", "Criteria for Similarity", "Thales Theorem", "Pythagoras Theorem", "Areas of Similar Triangles"],
                duration: "15 Hours"
            },
            {
                title: "Coordinate Geometry",
                topics: ["Distance Formula", "Section Formula", "Area of Triangle using Coordinates"],
                duration: "10 Hours"
            },
            {
                title: "Introduction to Trigonometry",
                topics: ["Trigonometric Ratios", "Values of sin, cos, tan (0°, 30°, 45°, 60°, 90°)", "Trigonometric Ratios of Complementary Angles"],
                duration: "12 Hours"
            },
            {
                title: "Trigonometric Identities",
                topics: ["Fundamental Trigonometric Identities", "Identity Simplification", "Verification of Identities"],
                duration: "8 Hours"
            },
            {
                title: "Heights and Distances",
                topics: ["Angle of Elevation", "Angle of Depression", "Applications in Real-life Problems"],
                duration: "10 Hours"
            },
            {
                title: "Circles",
                topics: ["Tangents to a Circle", "Number of Tangents from a Point", "Theorems and Proofs"],
                duration: "12 Hours"
            },
            {
                title: "Constructions",
                topics: ["Division of Line Segments", "Triangle Constructions", "Tangents to Circles"],
                duration: "8 Hours"
            },
            {
                title: "Areas Related to Circles",
                topics: ["Area of Sector and Segment", "Combination of Plane Figures", "Areas of Different Segments"],
                duration: "10 Hours"
            },
            {
                title: "Surface Areas and Volumes",
                topics: ["Surface Area and Volume of Cube, Cuboid, Cone, Cylinder, Sphere", "Combination of Solids", "Conversion of Solid from One Shape to Another"],
                duration: "14 Hours"
            },
            {
                title: "Statistics",
                topics: ["Mean, Median, Mode of Grouped Data", "Cumulative Frequency Graphs", "Ogive"],
                duration: "10 Hours"
            },
            {
                title: "Probability",
                topics: ["Classical Probability", "Simple Events", "Theoretical Probability"],
                duration: "8 Hours"
            }
        ]
    },
    "class10-science": {
        title: "Class 10 Science",
        description: "Explore advanced concepts in Chemical Substances, World of Living, Natural Phenomena, and Natural Resources.",
        chapters: [
            {
                title: "Light – Reflection and Refraction",
                topics: ["Laws of Reflection", "Ray Diagrams for Mirrors and Lenses", "Mirror Formula", "Lens Formula", "Magnification"],
                duration: "14 Hours"
            },
            {
                title: "The Human Eye and the Colourful World",
                topics: ["Structure of Human Eye", "Defects of Vision and Correction", "Dispersion of Light", "Scattering of Light", "Atmospheric Refraction"],
                duration: "10 Hours"
            },
            {
                title: "Electricity",
                topics: ["Electric Current and Potential Difference", "Ohm's Law", "Resistance in Series and Parallel", "Heating Effect of Electric Current", "Electric Power"],
                duration: "14 Hours"
            },
            {
                title: "Magnetic Effects of Electric Current",
                topics: ["Magnetic Field and Field Lines", "Fleming's Left Hand Rule", "Fleming's Right Hand Rule", "Electromagnetic Induction", "Electric Motor and Generator"],
                duration: "12 Hours"
            },
            {
                title: "Chemical Reactions and Equations",
                topics: ["Types of Chemical Reactions", "Balancing Chemical Equations", "Oxidation and Reduction", "Corrosion", "Rancidity"],
                duration: "10 Hours"
            },
            {
                title: "Acids, Bases and Salts",
                topics: ["Properties of Acids and Bases", "pH Scale", "Common Salts (Washing Soda, Baking Soda, Bleaching Powder)", "Uses of Acids and Bases"],
                duration: "12 Hours"
            },
            {
                title: "Metals and Non-metals",
                topics: ["Physical Properties", "Chemical Properties of Metals", "Extraction of Metals", "Corrosion and Prevention", "Reactivity Series"],
                duration: "14 Hours"
            },
            {
                title: "Carbon and its Compounds",
                topics: ["Covalent Bonding in Carbon", "Hydrocarbons (Alkanes, Alkenes, Alkynes)", "Functional Groups", "Nomenclature", "Soaps and Detergents"],
                duration: "16 Hours"
            },
            {
                title: "Sources of Energy",
                topics: ["Renewable and Non-renewable Energy", "Thermal Power Plants", "Solar Energy", "Wind Energy", "Nuclear Energy", "Biogas"],
                duration: "10 Hours"
            },
            {
                title: "Life Processes",
                topics: ["Nutrition (Autotrophic and Heterotrophic)", "Respiration (Aerobic and Anaerobic)", "Transportation in Plants and Animals", "Excretion in Plants and Animals"],
                duration: "16 Hours"
            },
            {
                title: "Control and Coordination",
                topics: ["Nervous System in Animals", "Coordination in Plants", "Hormones and Endocrine System", "Reflex Actions"],
                duration: "12 Hours"
            },
            {
                title: "How do Organisms Reproduce",
                topics: ["Asexual Reproduction", "Sexual Reproduction", "Human Reproductive System", "Reproductive Health"],
                duration: "12 Hours"
            },
            {
                title: "Heredity and Evolution",
                topics: ["Mendel's Experiments", "Traits and Inheritance", "Sex Determination", "Evolution and Speciation", "Natural Selection"],
                duration: "14 Hours"
            },
            {
                title: "Environment",
                topics: ["Ecosystem Components", "Food Chains and Food Webs", "Energy Flow in Ecosystem", "Biodegradable and Non-biodegradable Substances"],
                duration: "10 Hours"
            },
            {
                title: "Management of Natural Resources",
                topics: ["Conservation of Natural Resources", "Sustainable Development", "Forest and Wildlife Conservation", "Water Harvesting"],
                duration: "8 Hours"
            }
        ]
    },
    "class11-math": {
        title: "Class 11 Mathematics",
        description: "Master the foundations of higher mathematics. From Sets and Functions to the complexities of Trigonometry and Algebra, prepare for competitive excellence.",
        chapters: [
            {
                title: "Sets",
                topics: ["Sets and their Representations", "Empty Set", "Finite and Infinite Sets", "Subsets", "Power Set", "Universal Set", "Venn Diagrams", "Operations on Sets (Union, Intersection, Difference, Complement)"],
                duration: "10 Hours"
            },
            {
                title: "Relations and Functions",
                topics: ["Ordered Pairs", "Cartesian Product of Sets", "Relations", "Domain and Range of a Relation", "Functions", "Domain, Co-domain and Range of a Function", "Types of Functions (One-one, Onto, Bijective)"],
                duration: "12 Hours"
            },
            {
                title: "Trigonometric Functions",
                topics: ["Angles and their Measurement", "Trigonometric Ratios", "Trigonometric Functions of Sum and Difference of Two Angles", "Trigonometric Identities", "Graphs of Trigonometric Functions"],
                duration: "16 Hours"
            },
            {
                title: "Principle of Mathematical Induction",
                topics: ["Motivation", "Principle of Mathematical Induction", "Simple Applications"],
                duration: "6 Hours"
            },
            {
                title: "Complex Numbers and Quadratic Equations",
                topics: ["Complex Numbers", "Algebra of Complex Numbers", "Argand Plane", "Polar Representation of Complex Numbers", "Quadratic Equations", "Solutions of Quadratic Equations in Complex Number System"],
                duration: "12 Hours"
            },
            {
                title: "Linear Inequalities",
                topics: ["Inequalities", "Algebraic Solutions of Linear Inequalities in One Variable", "Graphical Solution of Linear Inequalities in Two Variables", "Solution of System of Linear Inequalities in Two Variables"],
                duration: "8 Hours"
            },
            {
                title: "Permutations and Combinations",
                topics: ["Fundamental Principle of Counting", "Factorial Notation", "Permutations", "Permutations when all Objects are Distinct", "Permutations when all Objects are not Distinct", "Combinations"],
                duration: "12 Hours"
            },
            {
                title: "Binomial Theorem",
                topics: ["Binomial Theorem for Positive Integral Indices", "General and Middle Terms", "Simple Applications"],
                duration: "8 Hours"
            },
            {
                title: "Sequences and Series",
                topics: ["Sequences", "Series", "Arithmetic Progression (A.P.)", "Arithmetic Mean", "Geometric Progression (G.P.)", "Geometric Mean", "Sum to n Terms of Special Series"],
                duration: "12 Hours"
            },
            {
                title: "Straight Lines",
                topics: ["Slope of a Line", "Various Forms of Equations of a Line", "General Equation of a Line", "Distance of a Point from a Line"],
                duration: "10 Hours"
            },
            {
                title: "Conic Sections",
                topics: ["Sections of a Cone", "Circle (Standard Equation)", "Parabola (Standard Equation)", "Ellipse (Standard Equation)", "Hyperbola (Standard Equation)"],
                duration: "14 Hours"
            },
            {
                title: "Introduction to Three-Dimensional Geometry",
                topics: ["Coordinate Axes and Coordinate Planes in Three Dimensions", "Coordinates of a Point in Space", "Distance between Two Points", "Section Formula"],
                duration: "8 Hours"
            },
            {
                title: "Limits and Derivatives",
                topics: ["Intuitive Idea of Derivatives", "Limits", "Limits of Trigonometric Functions", "Derivatives", "Algebra of Derivative of Functions", "Derivative of Polynomial and Trigonometric Functions"],
                duration: "14 Hours"
            },
            {
                title: "Statistics",
                topics: ["Measures of Dispersion", "Range", "Mean Deviation", "Variance and Standard Deviation", "Analysis of Frequency Distributions"],
                duration: "10 Hours"
            },
            {
                title: "Probability",
                topics: ["Random Experiments", "Outcomes", "Sample Space", "Events", "Occurrence of an Event", "Axiomatic Approach to Probability", "Probability of an Event", "Probability of 'not', 'and' and 'or' Events"],
                duration: "10 Hours"
            }
        ]
    },
    "class11-physics": {
        title: "Class 11 Physics",
        description: "Understand the laws governing the universe, from kinematics to thermodynamics and waves.",
        chapters: [
            {
                title: "Physical World and Measurement",
                topics: ["Scope and Excitement of Physics", "Nature of Physical Laws", "Units and Measurements", "SI Units", "Significant Figures", "Errors in Measurement", "Dimensions and Dimensional Analysis"],
                duration: "10 Hours"
            },
            {
                title: "Motion in a Straight Line",
                topics: ["Position, Path Length and Displacement", "Average Velocity and Speed", "Instantaneous Velocity and Speed", "Acceleration", "Graphical Analysis of Motion", "Equations of Motion for Uniformly Accelerated Motion"],
                duration: "12 Hours"
            },
            {
                title: "Motion in a Plane",
                topics: ["Scalars and Vectors", "Vector Addition and Subtraction", "Projectile Motion", "Uniform Circular Motion", "Relative Velocity"],
                duration: "14 Hours"
            },
            {
                title: "Laws of Motion",
                topics: ["Newton's First Law of Motion", "Newton's Second Law of Motion", "Newton's Third Law of Motion", "Free Body Diagrams", "Friction", "Circular Motion Applications"],
                duration: "14 Hours"
            },
            {
                title: "Work, Energy and Power",
                topics: ["Work Done by a Constant Force", "Work Done by a Variable Force", "Kinetic Energy", "Potential Energy", "Power", "Conservative and Non-conservative Forces", "Work-Energy Theorem"],
                duration: "12 Hours"
            },
            {
                title: "System of Particles and Rotational Motion",
                topics: ["Centre of Mass", "Linear Momentum of a System of Particles", "Torque and Angular Momentum", "Moment of Inertia", "Theorems of Perpendicular and Parallel Axes", "Rolling Motion"],
                duration: "16 Hours"
            },
            {
                title: "Gravitation",
                topics: ["Universal Law of Gravitation", "Acceleration due to Gravity", "Kepler's Laws of Planetary Motion", "Gravitational Potential Energy", "Escape Velocity", "Earth Satellites", "Energy of an Orbiting Satellite"],
                duration: "12 Hours"
            },
            {
                title: "Mechanical Properties of Solids",
                topics: ["Stress and Strain", "Hooke's Law", "Elastic Moduli (Young's, Bulk, Shear)", "Stress-Strain Curve", "Elastic Energy"],
                duration: "10 Hours"
            },
            {
                title: "Mechanical Properties of Fluids",
                topics: ["Pressure in a Fluid", "Pascal's Law", "Buoyancy and Archimedes' Principle", "Streamline Flow", "Bernoulli's Principle", "Viscosity", "Surface Tension"],
                duration: "14 Hours"
            },
            {
                title: "Thermal Properties of Matter",
                topics: ["Heat and Temperature", "Measurement of Temperature", "Thermal Expansion", "Specific Heat Capacity", "Calorimetry", "Change of State", "Latent Heat"],
                duration: "12 Hours"
            },
            {
                title: "Thermodynamics",
                topics: ["Zeroth Law of Thermodynamics", "First Law of Thermodynamics", "Internal Energy", "Specific Heat Capacities", "Thermodynamic Processes", "Heat Engines", "Carnot Engine", "Second Law of Thermodynamics"],
                duration: "14 Hours"
            },
            {
                title: "Kinetic Theory",
                topics: ["Kinetic Theory of an Ideal Gas", "Pressure of an Ideal Gas", "Kinetic Interpretation of Temperature", "Degrees of Freedom", "Law of Equipartition of Energy", "Mean Free Path"],
                duration: "10 Hours"
            },
            {
                title: "Oscillations",
                topics: ["Simple Harmonic Motion", "Energy in Simple Harmonic Motion", "Simple Pendulum", "Damped Oscillations", "Forced Oscillations and Resonance"],
                duration: "12 Hours"
            },
            {
                title: "Waves",
                topics: ["Wave Motion", "Transverse and Longitudinal Waves", "Displacement Relation for a Progressive Wave", "Speed of a Travelling Wave", "Principle of Superposition", "Reflection of Waves", "Standing Waves", "Beats", "Doppler Effect"],
                duration: "14 Hours"
            }
        ]
    },
    "class11-chemistry": {
        title: "Class 11 Chemistry",
        description: "Dive into the microscopic world of atoms, chemical bonding, and organic chemistry.",
        chapters: [
            {
                title: "Some Basic Concepts of Chemistry",
                topics: ["Importance of Chemistry", "Mole Concept and Molar Masses", "Stoichiometry and Stoichiometric Calculations", "Laws of Chemical Combination", "Percentage Composition"],
                duration: "10 Hours"
            },
            {
                title: "Structure of Atom",
                topics: ["Discovery of Sub-atomic Particles", "Atomic Models (Thomson, Rutherford, Bohr)", "Quantum Mechanical Model of Atom", "Quantum Numbers", "Electronic Configuration", "Aufbau Principle, Pauli Exclusion Principle, Hund's Rule"],
                duration: "14 Hours"
            },
            {
                title: "States of Matter (Gases and Liquids)",
                topics: ["Intermolecular Forces", "Gas Laws (Boyle's, Charles', Avogadro's)", "Ideal Gas Equation", "Kinetic Theory of Gases", "Real Gases and Deviation from Ideal Behaviour", "Liquefaction of Gases", "Liquid State"],
                duration: "12 Hours"
            },
            {
                title: "Thermodynamics",
                topics: ["System and Surroundings", "Internal Energy", "First Law of Thermodynamics", "Enthalpy", "Enthalpy Changes", "Hess's Law of Constant Heat Summation", "Entropy", "Gibbs Energy and Spontaneity"],
                duration: "14 Hours"
            },
            {
                title: "Equilibrium",
                topics: ["Chemical Equilibrium", "Law of Mass Action", "Equilibrium Constant", "Le Chatelier's Principle", "Ionic Equilibrium", "Acids and Bases", "pH Scale", "Buffer Solutions", "Solubility Product"],
                duration: "16 Hours"
            },
            {
                title: "Classification of Elements and Periodicity in Properties",
                topics: ["Modern Periodic Law", "Periodic Trends in Properties", "Atomic and Ionic Radii", "Ionization Enthalpy", "Electron Gain Enthalpy", "Electronegativity", "Valency"],
                duration: "10 Hours"
            },
            {
                title: "Chemical Bonding and Molecular Structure",
                topics: ["Ionic or Electrovalent Bond", "Covalent Bond", "Lewis Structure", "VSEPR Theory", "Valence Bond Theory", "Hybridization", "Molecular Orbital Theory", "Hydrogen Bonding"],
                duration: "16 Hours"
            },
            {
                title: "Redox Reactions",
                topics: ["Oxidation and Reduction", "Oxidation Number", "Balancing Redox Reactions", "Redox Reactions in Terms of Electron Transfer"],
                duration: "8 Hours"
            },
            {
                title: "Hydrogen",
                topics: ["Position of Hydrogen in Periodic Table", "Isotopes of Hydrogen", "Preparation, Properties and Uses of Hydrogen", "Hydrides (Ionic, Covalent, Metallic)", "Water", "Hydrogen Peroxide"],
                duration: "8 Hours"
            },
            {
                title: "s-Block Elements (Alkali and Alkaline Earth Metals)",
                topics: ["Group 1 Elements (Alkali Metals)", "Group 2 Elements (Alkaline Earth Metals)", "General Characteristics", "Anomalous Properties", "Biological Importance of Sodium, Potassium, Magnesium, Calcium"],
                duration: "12 Hours"
            },
            {
                title: "Some p-Block Elements",
                topics: ["Group 13 Elements (Boron Family)", "Group 14 Elements (Carbon Family)", "Important Compounds of Boron", "Important Compounds of Carbon and Silicon"],
                duration: "12 Hours"
            },
            {
                title: "Organic Chemistry – Some Basic Principles and Techniques",
                topics: ["IUPAC Nomenclature of Organic Compounds", "Isomerism (Structural and Stereoisomerism)", "Electronic Displacements (Inductive Effect, Resonance, Hyperconjugation)", "Homolytic and Heterolytic Fission", "Purification Techniques", "Qualitative Analysis"],
                duration: "16 Hours"
            },
            {
                title: "Hydrocarbons",
                topics: ["Classification of Hydrocarbons", "Alkanes (Preparation, Properties, Conformations)", "Alkenes (Preparation, Properties)", "Alkynes (Preparation, Properties)", "Aromatic Hydrocarbons (Benzene - Structure, Aromaticity)", "Carcinogenicity and Toxicity"],
                duration: "14 Hours"
            }
        ]
    },
    "class11-astro": {
        title: "Class 11 Astronomy",
        description: "Explore the cosmos, celestial mechanics, and the life cycles of stars.",
        chapters: [
            {
                title: "Introduction to Astronomy",
                topics: ["What is Astronomy and Astrophysics", "Branches of Astronomy", "Astronomical Distances (AU, Light-year, Parsec)", "Scales of the Universe"],
                duration: "8 Hours"
            },
            {
                title: "Earth & Sky",
                topics: ["Shape and Size of Earth", "Latitude and Longitude", "Rotation and Revolution", "Seasons", "Time (Solar Time, Sidereal Time)", "Celestial Sphere"],
                duration: "12 Hours"
            },
            {
                title: "The Moon",
                topics: ["Phases of the Moon", "Lunar Eclipses", "Solar Eclipses", "Tides", "Surface Features of the Moon"],
                duration: "10 Hours"
            },
            {
                title: "The Sun",
                topics: ["Structure of the Sun", "Solar Atmosphere (Photosphere, Chromosphere, Corona)", "Sunspots and Solar Activity", "Solar Energy and Nuclear Fusion"],
                duration: "12 Hours"
            },
            {
                title: "The Solar System",
                topics: ["Planets and their Properties", "Asteroids", "Comets", "Meteoroids", "Kuiper Belt and Oort Cloud"],
                duration: "14 Hours"
            },
            {
                title: "Stars",
                topics: ["Brightness and Magnitude", "Color and Temperature of Stars", "Hertzsprung–Russell (H–R) Diagram", "Stellar Evolution", "Life Cycle of Stars"],
                duration: "14 Hours"
            },
            {
                title: "Galaxies & Universe",
                topics: ["The Milky Way Galaxy", "Types of Galaxies", "Nebulae", "Expanding Universe", "Big Bang Theory", "Dark Matter and Dark Energy"],
                duration: "12 Hours"
            },
            {
                title: "Observational Astronomy",
                topics: ["Telescopes (Refracting and Reflecting)", "Resolving Power", "Light Collection", "Electromagnetic Spectrum", "Radio Astronomy"],
                duration: "10 Hours"
            },
            {
                title: "Basic Astrophysics",
                topics: ["Blackbody Radiation", "Doppler Effect", "Spectra (Emission and Absorption)", "Redshift and Blueshift", "Spectroscopy"],
                duration: "12 Hours"
            }
        ]
    },
    "class12-math": {
        title: "Class 12 Mathematics",
        description: "Final sprint towards competitive success. Relations, Calculus, Vectors, and Probability.",
        chapters: [
            {
                title: "Relations and Functions",
                topics: ["Types of Relations", "Reflexive, Symmetric, Transitive and Equivalence Relations", "One to One and Onto Functions", "Composite Functions", "Inverse of a Function", "Binary Operations"],
                duration: "12 Hours"
            },
            {
                title: "Inverse Trigonometric Functions",
                topics: ["Definition", "Range", "Domain", "Principal Value Branch", "Graphs of Inverse Trigonometric Functions", "Properties of Inverse Trigonometric Functions"],
                duration: "10 Hours"
            },
            {
                title: "Matrices",
                topics: ["Concept of Matrix", "Types of Matrices", "Operations on Matrices", "Transpose of a Matrix", "Symmetric and Skew Symmetric Matrices", "Elementary Operations on Matrices", "Invertible Matrices"],
                duration: "12 Hours"
            },
            {
                title: "Determinants",
                topics: ["Determinant of a Square Matrix", "Properties of Determinants", "Minors and Cofactors", "Adjoint and Inverse of a Matrix", "Applications of Determinants (Area of Triangle)", "Solution of System of Linear Equations (Cramer's Rule)"],
                duration: "14 Hours"
            },
            {
                title: "Continuity and Differentiability",
                topics: ["Continuity", "Differentiability", "Derivatives of Composite Functions", "Derivatives of Inverse Trigonometric Functions", "Exponential and Logarithmic Functions", "Logarithmic Differentiation", "Derivatives in Parametric Forms", "Second Order Derivatives", "Mean Value Theorem"],
                duration: "16 Hours"
            },
            {
                title: "Applications of Derivatives",
                topics: ["Rate of Change of Quantities", "Increasing and Decreasing Functions", "Tangents and Normals", "Approximations", "Maxima and Minima", "First Derivative Test", "Second Derivative Test"],
                duration: "14 Hours"
            },
            {
                title: "Integrals",
                topics: ["Integration as Inverse Process of Differentiation", "Methods of Integration (Substitution, Integration by Parts)", "Integrals of Some Particular Functions", "Integration by Partial Fractions", "Definite Integral", "Fundamental Theorem of Calculus", "Properties of Definite Integrals"],
                duration: "18 Hours"
            },
            {
                title: "Applications of Integrals",
                topics: ["Area under Simple Curves", "Area between Two Curves", "Area of the Region Bounded by a Curve and a Line"],
                duration: "10 Hours"
            },
            {
                title: "Differential Equations",
                topics: ["Definition, Order and Degree", "General and Particular Solutions", "Formation of Differential Equations", "Solution of Differential Equations by Method of Separation of Variables", "Homogeneous Differential Equations", "Linear Differential Equations"],
                duration: "12 Hours"
            },
            {
                title: "Vectors",
                topics: ["Vectors and Scalars", "Magnitude and Direction of a Vector", "Types of Vectors", "Addition of Vectors", "Multiplication of a Vector by a Scalar", "Position Vector", "Scalar (Dot) Product of Vectors", "Vector (Cross) Product of Vectors"],
                duration: "14 Hours"
            },
            {
                title: "Three-Dimensional Geometry",
                topics: ["Direction Cosines and Direction Ratios of a Line", "Equation of a Line in Space", "Angle between Two Lines", "Shortest Distance between Two Lines", "Plane", "Coplanarity of Two Lines", "Angle between Two Planes", "Distance of a Point from a Plane", "Angle between a Line and a Plane"],
                duration: "14 Hours"
            },
            {
                title: "Probability",
                topics: ["Conditional Probability", "Multiplication Theorem on Probability", "Independent Events", "Bayes' Theorem", "Random Variables and its Probability Distributions", "Bernoulli Trials and Binomial Distribution", "Mean and Variance of Random Variable"],
                duration: "14 Hours"
            }
        ]
    },
    "class12-physics": {
        title: "Class 12 Physics",
        description: "Master electromagnetism, optics, and modern physics for board exams and entrance tests.",
        chapters: [
            {
                title: "Electric Charges and Fields",
                topics: ["Electric Charges", "Conductors and Insulators", "Coulomb's Law", "Electric Field", "Electric Field Lines", "Electric Flux", "Gauss's Law and its Applications"],
                duration: "14 Hours"
            },
            {
                title: "Electrostatic Potential and Capacitance",
                topics: ["Electric Potential and Potential Difference", "Potential due to a Point Charge", "Equipotential Surfaces", "Capacitors and Capacitance", "Parallel Plate Capacitor", "Combination of Capacitors", "Energy Stored in a Capacitor", "Dielectrics"],
                duration: "14 Hours"
            },
            {
                title: "Current Electricity",
                topics: ["Electric Current", "Ohm's Law", "Resistance and Resistivity", "Series and Parallel Combinations of Resistors", "Kirchhoff's Laws", "Wheatstone Bridge", "Meter Bridge", "Potentiometer"],
                duration: "14 Hours"
            },
            {
                title: "Moving Charges and Magnetism",
                topics: ["Magnetic Force on a Moving Charge", "Lorentz Force", "Motion of Charged Particle in Magnetic Field", "Biot–Savart Law", "Ampere's Circuital Law", "Magnetic Field due to Current-carrying Conductor", "Force between Two Parallel Currents"],
                duration: "14 Hours"
            },
            {
                title: "Magnetism and Matter",
                topics: ["Bar Magnet", "Magnetic Field Lines", "Magnetic Dipole Moment", "Earth's Magnetism", "Magnetic Properties of Materials", "Diamagnetic, Paramagnetic and Ferromagnetic Substances"],
                duration: "10 Hours"
            },
            {
                title: "Electromagnetic Induction",
                topics: ["Faraday's Laws of Electromagnetic Induction", "Lenz's Law", "Motional Electromotive Force", "Self-Inductance and Mutual Inductance", "Eddy Currents"],
                duration: "12 Hours"
            },
            {
                title: "Alternating Current",
                topics: ["AC Voltage and Current", "AC Circuit with Resistor, Inductor, Capacitor", "LCR Series Circuit", "Resonance", "Power in AC Circuits", "Power Factor", "Transformers"],
                duration: "14 Hours"
            },
            {
                title: "Electromagnetic Waves",
                topics: ["Displacement Current", "Maxwell's Equations (Qualitative)", "Electromagnetic Waves", "Electromagnetic Spectrum", "Uses of Different Parts of EM Spectrum"],
                duration: "8 Hours"
            },
            {
                title: "Ray Optics and Optical Instruments",
                topics: ["Reflection of Light by Spherical Mirrors", "Refraction", "Total Internal Reflection", "Refraction at Spherical Surfaces", "Lenses", "Lens Formula", "Magnification", "Optical Instruments (Microscope, Telescope)"],
                duration: "16 Hours"
            },
            {
                title: "Wave Optics",
                topics: ["Huygens' Principle", "Interference", "Young's Double Slit Experiment", "Diffraction", "Single Slit Diffraction", "Resolving Power", "Polarization"],
                duration: "12 Hours"
            },
            {
                title: "Dual Nature of Radiation and Matter",
                topics: ["Photoelectric Effect", "Einstein's Photoelectric Equation", "Particle Nature of Light", "Wave Nature of Matter", "de Broglie Wavelength", "Davisson-Germer Experiment"],
                duration: "10 Hours"
            },
            {
                title: "Atoms",
                topics: ["Alpha-Particle Scattering Experiment", "Rutherford's Model of Atom", "Bohr Model of Hydrogen Atom", "Energy Levels", "Hydrogen Spectrum", "Spectral Series"],
                duration: "10 Hours"
            },
            {
                title: "Nuclei",
                topics: ["Atomic Masses and Composition of Nucleus", "Size of Nucleus", "Mass-Energy Relation", "Nuclear Binding Energy", "Radioactivity", "Alpha, Beta and Gamma Decay", "Nuclear Fission and Fusion"],
                duration: "12 Hours"
            },
            {
                title: "Semiconductor Electronics: Materials, Devices and Simple Circuits",
                topics: ["Energy Bands in Conductors, Semiconductors and Insulators", "Intrinsic and Extrinsic Semiconductors", "p-n Junction", "Semiconductor Diode", "Diode as a Rectifier", "Junction Transistor", "Transistor as an Amplifier and Oscillator", "Logic Gates"],
                duration: "14 Hours"
            }
        ]
    },
    "class12-chemistry": {
        title: "Class 12 Chemistry",
        description: "Advanced study of Solutions, Electrochemistry, Kinetics, and Organic Chemistry.",
        chapters: [
            {
                title: "Solid State",
                topics: ["Classification of Solids", "Unit Cell and Lattice", "Crystal Systems", "Packing Efficiency", "Defects in Solids", "Electrical and Magnetic Properties"],
                duration: "12 Hours"
            },
            {
                title: "Solutions",
                topics: ["Types of Solutions", "Concentration Terms", "Solubility", "Vapour Pressure of Liquid Solutions", "Raoult's Law", "Colligative Properties", "Abnormal Molar Masses"],
                duration: "12 Hours"
            },
            {
                title: "Electrochemistry",
                topics: ["Electrochemical Cells", "Galvanic Cells", "Nernst Equation", "Conductance in Electrolytic Solutions", "Electrolytic Cells", "Batteries", "Fuel Cells", "Corrosion"],
                duration: "14 Hours"
            },
            {
                title: "Chemical Kinetics",
                topics: ["Rate of a Chemical Reaction", "Factors Influencing Rate of Reaction", "Rate Law and Order of Reaction", "Integrated Rate Equations", "Half-life of a Reaction", "Collision Theory", "Activation Energy"],
                duration: "12 Hours"
            },
            {
                title: "Surface Chemistry",
                topics: ["Adsorption", "Catalysis", "Colloids", "Classification of Colloids", "Emulsions", "Applications of Colloids"],
                duration: "10 Hours"
            },
            {
                title: "General Principles and Processes of Isolation of Elements",
                topics: ["Occurrence of Metals", "Concentration of Ores", "Extraction of Crude Metal", "Thermodynamic Principles of Metallurgy", "Electrochemical Principles", "Oxidation and Reduction", "Refining"],
                duration: "10 Hours"
            },
            {
                title: "p-Block Elements",
                topics: ["Group 15 Elements (Nitrogen Family)", "Group 16 Elements (Oxygen Family)", "Group 17 Elements (Halogens)", "Group 18 Elements (Noble Gases)", "Trends in Properties", "Important Compounds"],
                duration: "16 Hours"
            },
            {
                title: "d- and f-Block Elements",
                topics: ["Transition Elements", "Electronic Configuration", "General Properties of Transition Elements", "Lanthanoids", "Actinoids", "Some Important Compounds of Transition Elements"],
                duration: "12 Hours"
            },
            {
                title: "Coordination Compounds",
                topics: ["Werner's Theory", "Nomenclature of Coordination Compounds", "Isomerism in Coordination Compounds", "Bonding in Coordination Compounds", "Crystal Field Theory", "Importance and Applications"],
                duration: "14 Hours"
            },
            {
                title: "Haloalkanes and Haloarenes",
                topics: ["Classification and Nomenclature", "Nature of C-X Bond", "Methods of Preparation", "Physical Properties", "Chemical Reactions", "Polyhalogen Compounds"],
                duration: "14 Hours"
            },
            {
                title: "Alcohols, Phenols and Ethers",
                topics: ["Classification and Nomenclature", "Structures of Functional Groups", "Alcohols (Preparation, Properties, Reactions)", "Phenols (Preparation, Properties, Reactions)", "Ethers (Preparation, Properties, Reactions)"],
                duration: "14 Hours"
            },
            {
                title: "Aldehydes, Ketones and Carboxylic Acids",
                topics: ["Nomenclature and Structure", "Preparation of Aldehydes and Ketones", "Physical and Chemical Properties", "Uses", "Carboxylic Acids (Preparation, Properties, Reactions)", "Chemical Tests"],
                duration: "16 Hours"
            },
            {
                title: "Amines",
                topics: ["Classification and Nomenclature", "Structure of Amines", "Preparation of Amines", "Physical and Chemical Properties", "Diazonium Salts (Preparation, Chemical Reactions, Importance)"],
                duration: "12 Hours"
            },
            {
                title: "Biomolecules",
                topics: ["Carbohydrates (Classification, Monosaccharides, Oligosaccharides, Polysaccharides)", "Proteins (Amino Acids, Structure of Proteins)", "Enzymes", "Vitamins", "Nucleic Acids (DNA and RNA)", "Hormones"],
                duration: "12 Hours"
            },
            {
                title: "Polymers",
                topics: ["Classification of Polymers", "Types of Polymerization", "Molecular Mass of Polymers", "Biodegradable and Non-biodegradable Polymers", "Important Polymers and their Uses"],
                duration: "8 Hours"
            },
            {
                title: "Chemistry in Everyday Life",
                topics: ["Drugs and their Classification", "Drug-Target Interaction", "Therapeutic Action of Different Classes of Drugs", "Chemicals in Food", "Cleansing Agents"],
                duration: "8 Hours"
            }
        ]
    },
    "class12-astro": {
        title: "Class 12 Astronomy",
        description: "Advanced topics in Galactic Astronomy, Astrophysics, and Space Exploration.",
        chapters: [
            {
                title: "Celestial Mechanics",
                topics: ["Newton's Law of Gravitation (Astronomy Applications)", "Kepler's Laws of Planetary Motion", "Circular and Elliptical Orbits", "Satellites and Escape Velocity", "Tides and Tidal Forces"],
                duration: "14 Hours"
            },
            {
                title: "The Sun",
                topics: ["Solar Structure (Core, Radiative Zone, Convective Zone)", "Nuclear Fusion (pp-chain)", "Solar Atmosphere (Photosphere, Chromosphere, Corona)", "Sunspots and Solar Cycle", "Solar Wind", "Solar Activity and Space Weather"],
                duration: "12 Hours"
            },
            {
                title: "The Earth–Moon System",
                topics: ["Motions of Earth and Moon", "Phases of the Moon", "Solar and Lunar Eclipses", "Precession and Nutation", "Timekeeping (Solar Time, Sidereal Time, Atomic Time)"],
                duration: "12 Hours"
            },
            {
                title: "Stars & Stellar Evolution",
                topics: ["Stellar Brightness and Magnitude System", "Spectral Classification (OBAFGKM)", "Hertzsprung–Russell (H–R) Diagram", "Stellar Evolution (Protostar to Main Sequence to Giant to End States)", "White Dwarfs, Neutron Stars, and Black Holes"],
                duration: "16 Hours"
            },
            {
                title: "Galaxies",
                topics: ["Milky Way Structure", "Types of Galaxies (Spiral, Elliptical, Irregular)", "Galactic Rotation", "Dark Matter Evidence", "Active Galaxies and Quasars"],
                duration: "12 Hours"
            },
            {
                title: "Cosmology",
                topics: ["Expanding Universe", "Hubble's Law", "Big Bang Theory", "Cosmic Microwave Background (CMB)", "Dark Energy", "Future of the Universe"],
                duration: "12 Hours"
            },
            {
                title: "Observational Astronomy",
                topics: ["Optical Telescopes (Refracting and Reflecting)", "Resolving Power and Magnification", "Detectors (CCD)", "Radio, Infrared, and X-ray Astronomy", "Atmospheric Effects on Observations"],
                duration: "14 Hours"
            },
            {
                title: "Astrophysical Processes",
                topics: ["Blackbody Radiation", "Wien's Displacement Law", "Stefan–Boltzmann Law", "Doppler Effect in Astronomy", "Redshift and Blueshift", "Spectroscopy"],
                duration: "12 Hours"
            },
            {
                title: "Data Analysis & Sky Mapping",
                topics: ["Celestial Coordinates (Right Ascension, Declination)", "Star Charts and Sky Maps", "Light Curves", "Error Analysis in Astronomical Observations", "Data Reduction Techniques"],
                duration: "10 Hours"
            }
        ]
    },
    // Add fallbacks for other subjects to avoid crashes
    "default": {
        title: "Syllabus Overview",
        description: "Detailed syllabus content is being curated for this subject.",
        chapters: [
            { title: "Introduction", topics: ["Course Overview", "Prerequisites", "Learning Outcomes"], duration: "2 Hours", status: "Available" },
            { title: "Module 1", topics: ["Topic 1.1", "Topic 1.2", "Topic 1.3"], duration: "5 Hours", status: "Locked" }
        ]
    }
};

export default function SubjectSyllabusPage() {
    const params = useParams();
    const router = useRouter();
    const subjectId = params.subjectId;

    const data = syllabusData[subjectId] || syllabusData["default"];
    // If defaulting, we might want to use the ID to format a title nicely
    const displayTitle = syllabusData[subjectId] ? data.title : subjectId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    return (
        <div className="min-h-screen bg-background text-foreground p-6 lg:p-8 max-w-5xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => router.back()}
                suppressHydrationWarning
                className="flex items-center text-muted-foreground hover:text-primary transition-colors mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Subjects
            </button>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <BookOpen className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{displayTitle}</h1>
                </div>
                <p className="text-lg text-muted-foreground ml-1">{data.description}</p>
            </motion.div>

            {/* Syllabus List */}
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        <Map className="w-5 h-5 text-indigo-500" />
                        Curriculum Path
                    </h2>
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {data.chapters.length} Modules
                    </span>
                </div>

                {data.chapters.map((chapter, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                        {/* Chapter Header */}
                        <div className="px-6 py-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <span className="text-xs font-bold text-primary tracking-wider uppercase mb-1 block">
                                    Chapter {index + 1}
                                </span>
                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                    {chapter.title}
                                </h3>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground bg-muted px-3 py-1 rounded-lg">
                                <Clock className="w-4 h-4 mr-1.5" />
                                {chapter.duration}
                            </div>
                        </div>

                        {/* Topics List */}
                        <div className="p-6">
                            <div className="mb-5">
                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 block">Key Topics</span>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                                    {chapter.topics.map((topic, tIndex) => (
                                        <div key={tIndex} className="flex items-start gap-2">
                                            <CheckCircle2 className="w-4 h-4 mt-0.5 text-primary" />
                                            <span className="text-sm text-foreground/90">{topic}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-5 border-t border-border flex flex-wrap gap-4">
                                <button
                                    suppressHydrationWarning
                                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                >
                                    <PlayCircle className="w-5 h-5 mr-2" />
                                    Watch Lectures
                                </button>
                                <button
                                    suppressHydrationWarning
                                    className="inline-flex items-center px-4 py-2 bg-background text-foreground border border-border text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                                >
                                    <FileText className="w-5 h-5 mr-2" />
                                    View Notes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
