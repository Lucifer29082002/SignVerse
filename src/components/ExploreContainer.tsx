import './ExploreContainer.css';

interface ContainerProps { }

const ExploreContainer: React.FC<ContainerProps> = () => {
  return (
    <div id="container">
      <strong>Ready to create an app?</strong>
      <p>Start with Ionic <a target="_blank" rel="noopener noreferrer" href="https://ionicframework.com/docs/components">UI Components</a></p>
      <p>Camera Page <a target="_blank" rel="noopener noreferrer" href="/camera">Camera Page</a></p>
      <p>Mic Page <a target="_blank" rel="noopener noreferrer" href="/mic">Mic Page</a></p>
    </div>
  );
};

export default ExploreContainer;
