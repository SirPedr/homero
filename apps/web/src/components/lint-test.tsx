import { useState } from "react";

/**
 * Test component to demonstrate web-specific oxlint rules
 * This component intentionally violates several linting rules
 */
export function LintTest() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState([1, 2, 3]);

  // React perf issue: inline object in dependency array
  const handleClick = () => {
    setCount(count + 1);
  };

  // Accessibility issue: missing alt text
  const imageElement = <img src="test.jpg" />;

  // Accessibility issue: div with click handler but no role
  const clickableDiv = <div onClick={handleClick}>Click me</div>;

  // React issue: missing key in list
  const listItems = items.map((item) => <li>{item}</li>);

  // Accessibility issue: anchor without href
  const badLink = <a onClick={handleClick}>Click</a>;

  // React hooks issue: conditional hook (will cause error)
  // if (count > 5) {
  //   useState(0);
  // }

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-2xl font-bold">Lint Test Component</h1>

      <button
        onClick={handleClick}
        className="rounded bg-blue-500 px-4 py-2 text-white"
      >
        Count: {count}
      </button>

      {imageElement}
      {clickableDiv}

      <ul>{listItems}</ul>

      {badLink}

      {/* Accessibility: button without type */}
      <button className="bg-red-500 px-4 py-2 text-white">No Type</button>

      {/* Missing label for input */}
      <input type="text" placeholder="Enter text" className="border p-2" />
    </div>
  );
}
