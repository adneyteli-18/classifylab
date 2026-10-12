import { useState } from 'react'
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react'

const questions = [
  {
    question: 'What does k represent in the K-Nearest Neighbors algorithm?',
    options: [
      'The number of closest training points used to vote',
      'The number of columns in a dataset',
      'The distance between the first two rows',
    ],
    correctIndex: 0,
    explanation:
      'K is the number of nearest labeled examples that contribute to the prediction vote.',
  },
  {
    question: 'What can happen when k is set to 1?',
    options: [
      'Every point is assigned the same class',
      'A single closest training point decides the class',
      'The algorithm ignores distance',
    ],
    correctIndex: 1,
    explanation:
      'With k = 1, the label of the single nearest training example becomes the prediction.',
  },
  {
    question: 'Why is feature scaling often useful with distance-based methods?',
    options: [
      'It makes every label identical',
      'It lets features with different units contribute more comparably',
      'It removes the need to choose k',
    ],
    correctIndex: 1,
    explanation:
      'A feature with a much larger numeric range can otherwise dominate a distance calculation.',
  },
]

function LabExercise() {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [isChecked, setIsChecked] = useState(false)
  const question = questions[questionIndex]

  function checkAnswer() {
    if (selectedOption !== null) setIsChecked(true)
  }

  function goToQuestion(nextIndex) {
    setQuestionIndex(nextIndex)
    setSelectedOption(null)
    setIsChecked(false)
  }

  return (
    <section className="vlab-card exercise-card">
      <div className="vlab-card-heading">
        <div>
          <p className="vlab-eyebrow">KNOWLEDGE CHECK</p>
          <h2>Exercise {questionIndex + 1} of {questions.length}</h2>
        </div>
        <span className="exercise-progress">
          <span style={{ width: `${((questionIndex + 1) / questions.length) * 100}%` }} />
        </span>
      </div>

      <h3 className="exercise-question">{question.question}</h3>
      <div aria-label="Answer choices" className="exercise-options" role="radiogroup">
        {question.options.map((option, index) => {
          const isSelected = selectedOption === index
          const isCorrect = isChecked && index === question.correctIndex
          const isWrong = isChecked && isSelected && !isCorrect
          return (
            <button
              aria-checked={isSelected}
              className={`exercise-option${isSelected ? ' is-selected' : ''}${isCorrect ? ' is-correct' : ''}${isWrong ? ' is-wrong' : ''}`}
              key={option}
              onClick={() => {
                if (!isChecked) setSelectedOption(index)
              }}
              role="radio"
              type="button"
            >
              <span className="option-marker">
                {isCorrect ? <Check aria-hidden="true" size={15} /> : String.fromCharCode(65 + index)}
              </span>
              <span>{option}</span>
            </button>
          )
        })}
      </div>

      {isChecked && (
        <p className={`exercise-feedback${selectedOption === question.correctIndex ? ' is-correct' : ' is-wrong'}`}>
          <strong>{selectedOption === question.correctIndex ? 'Correct.' : 'Not quite.'}</strong>{' '}
          {question.explanation}
        </p>
      )}

      <div className="exercise-actions">
        <button
          className="vlab-button vlab-button-secondary"
          disabled={questionIndex === 0}
          onClick={() => goToQuestion(questionIndex - 1)}
          type="button"
        >
          <ArrowLeft aria-hidden="true" size={15} /> Previous
        </button>
        {!isChecked ? (
          <button
            className="vlab-button vlab-button-primary"
            disabled={selectedOption === null}
            onClick={checkAnswer}
            type="button"
          >
            Check answer <Check aria-hidden="true" size={15} />
          </button>
        ) : questionIndex < questions.length - 1 ? (
          <button
            className="vlab-button vlab-button-primary"
            onClick={() => goToQuestion(questionIndex + 1)}
            type="button"
          >
            Next question <ArrowRight aria-hidden="true" size={15} />
          </button>
        ) : (
          <button
            className="vlab-button vlab-button-primary"
            onClick={() => goToQuestion(0)}
            type="button"
          >
            Start again <RotateCcw aria-hidden="true" size={15} />
          </button>
        )}
      </div>
    </section>
  )
}

export default LabExercise
