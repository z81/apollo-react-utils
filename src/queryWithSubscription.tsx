import * as React from 'react';
import { Query, QueryProps, QueryResult, OperationVariables } from 'react-apollo';
import { SubscribeToMoreOptions, DocumentNode } from 'apollo-boost';

interface queryWithSubscriptionProps {
  query: Pick<QueryProps, Exclude<keyof QueryProps, 'children'>> | string;
  subscription: SubscribeToMoreOptions<OperationVariables, OperationVariables, OperationVariables> | string;
  subscriptionDataToProps?: Function;
  mutations?: { [key: string]: string };
}

class SubscriptionWrapper extends React.Component<{ subscribe: Function }> {
  componentDidMount = () => this.props.subscribe();
  render = () => this.props.children;
}

const defaultSubscriptionDataToProps = (data: any) => data;

const defaultUpdateQuery = (subscriptionDataToProps: Function) => (prev: any, { subscriptionData }: any) => {
  if (!subscriptionData.data) return prev;

  return subscriptionDataToProps(subscriptionData.data);
};

export const queryWithSubscription = ({
  query,
  subscription,
  mutations,
  subscriptionDataToProps = defaultSubscriptionDataToProps,
}: queryWithSubscriptionProps) => (Component: React.ComponentClass | ((props: any) => any)) => {
  const queryProps =
    typeof query === 'string' || (query as any)['kind'] ? { query: (query as any) as DocumentNode } : query;
  const subscriptionOptions =
    typeof subscription === 'string' || (subscription as any)['kind']
      ? { document: subscription }
      : (subscription as any);
  const updateQuery = defaultUpdateQuery(subscriptionDataToProps);

  return class extends React.Component {
    static displayName = `ComponentWithSubscription(${'name' in Component ? Component.name : 'Anonymous'})`;

    subscribe = ({ subscribeToMore }: QueryResult<OperationVariables>) => () =>
      subscribeToMore({
        updateQuery,
        ...subscriptionOptions,
      });

    render = () => (
      <Query {...queryProps}>
        {result => (
          <SubscriptionWrapper subscribe={this.subscribe(result)}>
            <Component {...result} {...{ mutations }} />
          </SubscriptionWrapper>
        )}
      </Query>
    );
  };
};
