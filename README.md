# fn lang
Functional programming at it's finest; handwritten lexer/parser in javascript for node. 

Pronounced "effin"

### About
This is a functional programming language interpreter that's based on something that kind of looks like [Scheme](https://en.wikipedia.org/wiki/Scheme_(programming_language)). I glanced over some python code by Peter Norvig's [lisp.py](http://norvig.com/lispy.html) for some ideas, but this is for the most part my crappy invention.

I'm working on a project that's going to use a functional-style scripting language and I built this as a quick proof of concept.

### About Part 2
It's scoped/environment based, meaning every parenthesis creates a new scope, which is a child of the enclosing/parent scope. So it's pretty inefficient because the lexer/parser is very simple.
* First class functions
* Variables (String and Float, officially)
* Importing functions from JavaScript
* Prefix Notation (Polish)
* Semi-lazy evaluation (aka incomplete lazy evaluation)

### Usage
To create a var (don't trust const, it's a lie):
```
(let x (1))
(const x (1))
(def x (1))
```

To create a function (this one accepts param 'n' and returns 'n - 1':
```
(def x lamba(n) (- n 1))
```

To import a javascript function, add it to `lib` at the top of the file and then import it:
```
(import + - * /)
```
Note that import keyword accepts multiple definitions.

You need to return something in functions and you need to put parens around your code to create the root scope. Other than that, this thing will blow up with javascript errors if you screw up your code.

#### Example
Fibonacii Sequence -- don't go over 23 you'll be waiting forever, lol.
```
(
    (import + - * / pow mod cond =)
    (def fib lambda(n) (
        cond 
            (= n 0)(0)
            (cond 
                (= n 1)(1)
                (+ (fib (- n 1)) (fib (- n 2)))
            )
        )
    )
    (fib 20)
)
```
