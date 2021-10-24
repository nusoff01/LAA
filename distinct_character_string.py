# input: string
# output: tuple of the number of distinct characters, and the string without any duplicate characters
def destinctCharacters (inputStr):
    distinctCharStr = ""
    charDict = {}
    for char in inputStr.replace(" ", ""): # remove white space
        if char not in charDict:
            charDict[char] = True
            distinctCharStr = distinctCharStr + char
    return (len(distinctCharStr), distinctCharStr) 


print("A few test cases: ")
# given example
exampleInputs = ["angels baseball!", "", "!@#$%^&*()_-="]

for exInput in exampleInputs:
    print("input: ", exInput)
    print("output: ", destinctCharacters(exInput))
    print()

while True:
    userInput = input("input a string to test the destinctCharacters function: ")
    print(destinctCharacters(userInput))