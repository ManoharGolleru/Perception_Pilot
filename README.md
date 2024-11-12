graph LR
    A[Camera] --> B[Computer Vision Model]
    B --> C[Large Language Model]
    C --> D[Interface]

    subgraph Computer Vision Model
        B1[Pose Estimation]
        B2[Frequency of Postural Deviations]
        B3[Fatigue Over Time]
        B --> B1
        B --> B2
        B --> B3
    end

    subgraph Large Language Model
        C1[Personalized Ergonomic Recommendations]
        C2[Micro Breaks]
        C3[Targeted Stretching]
        C --> C1
        C --> C2
        C --> C3
    end
