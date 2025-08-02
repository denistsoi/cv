# Micro:bit Programming Glossary & Reference 📚

## Core Programming Concepts

### 🔹 Variables

- **What it is**: A container that stores information (numbers, text, true/false values)
- **In MakeCode**: Found in the "Variables" category (orange blocks)
- **How to use**: Click "Make a Variable" to create one, then use "set" and "change" blocks
- **Examples**:
  - Create variable called "score", use "set score to 0" block
  - Create variable called "playerName", use "set playerName to Hello!" block
  - Create variable called "gameStarted", use "set gameStarted to true" block

### 🔹 Conditionals (If/Then/Else)

- **What it is**: Makes decisions in your code - "if this happens, then do that"
- **In MakeCode**: Found in the "Logic" category (teal blocks)
- **How to use**: Drag an "if" block and add conditions and actions
- **Examples**:
  - Use "if button A is pressed" block with "show icon happy" block inside
  - Use "if temperature > 25" block with "show icon fire" in first slot and "show icon snowflake" in else slot

### 🔹 Inputs

- **What it is**: Ways to get information INTO your Micro:bit from the real world
- **In MakeCode**: Found in the "Input" category (purple blocks)
- **Types**:
  - **Buttons**: Use "button A is pressed" or "button B is pressed" blocks
  - **Accelerometer**: Use "acceleration" or add "on shake" event blocks
  - **Temperature**: Use "temperature (°C)" block to get current temperature
  - **Compass**: Use "compass heading (°)" block for direction
  - **Light**: Use "light level" block to detect brightness
  - **Sound**: Use "sound level" block for microphone (on newer models)

### 🔹 Outputs

- **What it is**: Ways your Micro:bit shows or communicates information
- **In MakeCode**: Found in the "Basic" category (blue blocks)
- **Types**:
  - **LED Display**: Use "show string", "show number", "show icon" blocks
  - **Speaker**: Use "play tone" and "play melody" blocks from Music category
  - **Radio**: Use "radio send string" blocks from Radio category

### 🔹 Loops

- **What it is**: Repeats actions multiple times automatically
- **In MakeCode**: Found in the "Loops" category (green blocks)
- **Types**:
  - **Forever**: Use "forever" block - runs continuously
  - **Repeat X times**: Use "repeat 4 times" block - runs a specific number of times
  - **While**: Use "while true do" block - runs while a condition is true

### 🔹 Events

- **What it is**: Things that trigger your code to run
- **In MakeCode**: Found in the "Input" category (purple blocks)
- **Examples**:
  - "on start" block - runs when Micro:bit turns on
  - "on button A pressed" block - runs when you press button A
  - "on shake" block - runs when you shake the Micro:bit

### 🔹 Functions

- **What it is**: Custom blocks you create to organize your code
- **In MakeCode**: Found in the "Functions" category (cyan blocks)
- **Why use them**: Makes code cleaner and easier to reuse

---

## MakeCode Block Categories Reference

### 🎯 Where to Find Blocks

- [ ] **Basic** (blue)

  - Show LEDs, show string, show number
  - Pause, clear screen
  - Show icons and images

- [ ] **Input** (purple)

  - Button events (on button pressed)
  - Sensor readings (temperature, compass, acceleration)
  - Gesture events (on shake, on logo pressed)

- [ ] **Music** (red)

  - Play tone, play melody
  - Rest (silence)
  - Set tempo

- [ ] **Logic** (teal)

  - If/then/else statements
  - Comparison operators (=, <, >, ≠)
  - Boolean values (true/false)
  - And/or/not operators

- [ ] **Loops** (green)

  - Forever loop
  - Repeat X times
  - While loop
  - For loop

- [ ] **Variables** (red with stripes)

  - Make a variable
  - Set variable to value
  - Change variable by amount
  - Get variable value

- [ ] **Math** (purple)

  - Basic math (+, -, ×, ÷)
  - Random numbers
  - Math functions (square root, etc.)
  - Constants (π, etc.)

- [ ] **Functions** (blue)

  - Make a function
  - Call a function
  - Return values

- [ ] **Arrays** (orange)
  - Create lists of data
  - Add/remove items from lists
  - Get items from lists

---

## Quick Tips for Using MakeCode

### 🔍 Finding What You Need

1. **Use the search**: Type what you're looking for in the search box
2. **Check categories**: Blocks are organized by color and purpose
3. **Hover for help**: Hover over blocks to see what they do
4. **Use the simulator**: Test your code without a physical Micro:bit

### 💡 Best Practices

- [ ] **Start simple**: Begin with basic blocks and add complexity gradually
- [ ] **Use clear variable names**: `score` is better than `x`
- [ ] **Test frequently**: Run your code often to catch problems early
- [ ] **Comment your code**: Use the comment tool to explain what your code does
- [ ] **Save your work**: Download your projects to keep them safe

### 🐛 Debugging Tips

- [ ] **Check your connections**: Make sure blocks snap together properly
- [ ] **Look for red warnings**: MakeCode will highlight errors in red
- [ ] **Use the simulator**: Watch what happens step by step
- [ ] **Add show string blocks**: Display values to see what's happening
- [ ] **Start over if stuck**: Sometimes it's easier to rebuild a section
