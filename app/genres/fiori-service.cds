using {sap.capire.bookshop.Genres} from '@capire/bookshop';

annotate AdminService.Genres with @odata.draft.enabled;

annotate Genres with @cds.search: {name};

annotate Genres with {
  name @title: '{i18n>Genre}';
}

// Lists
annotate Genres with @(
  Common.SemanticKey: [name],
  UI.SelectionFields: [name],
  UI.LineItem       : [{
    Value: name,
    Label: '{i18n>Name}'
  }, ],
);

// Details
annotate Genres with @(UI: {
  Identification: [{Value: name}],
  HeaderInfo    : {
    TypeName      : '{i18n>Genre}',
    TypeNamePlural: '{i18n>Genres}',
    Title         : {Value: name},
    Description   : {Value: ID}
  }
});


// Tree Views
// TODO: In my setup, using the @hierarchy annotation does not work as expected.
// TODO: > I am getting a UI error that reports 'NodeProperty' can't be read from undefined
// TODO: > Using the 'Manual Approach' seems to work.
// TODO: > Outdated versions?
// TODO: >
// TODO: > @sap/cds: 9.6.3
// TODO: > @sap/cds-compiler: 6.6.0
// TODO: > @sap/cds-dk: 9.6.1
// TODO: > @sap/cds-dk (global): 9.6.1
// TODO: > @sap/cds-fiori: 2.1.1
// TODO: > @sap/cds-mtxs: 3.6.1
// TODO: > @cap-js/asyncapi: 1.0.3
// TODO: > @cap-js/cds-test: 0.4.1
// TODO: > @cap-js/db-service: 2.8.1
// TODO: > @cap-js/openapi: 1.3.1
// TODO: > @cap-js/sqlite: 2.1.2
// TODO: > Node.js: v22.21.1
// annotate AdminService.Genres with @hierarchy;

// 'Manual Approach' from capire
// declare a hierarchy with the qualifier "GenresHierarchy"
annotate AdminService.Genres with @Aggregation.RecursiveHierarchy #GenresHierarchy: {
  NodeProperty            : ID, // identifies a node, usually the key
  ParentNavigationProperty: parent // navigates to a node's parent
};

extend AdminService.Genres with @(
  // The computed properties expected by Fiori to be present in hierarchy entities
  Hierarchy.RecursiveHierarchy #GenresHierarchy          : {
    LimitedDescendantCount: LimitedDescendantCount,
    DistanceFromRoot      : DistanceFromRoot,
    DrillState            : DrillState,
    LimitedRank           : LimitedRank
  },
  // Disallow filtering on these properties from Fiori UIs
  Capabilities.FilterRestrictions.NonFilterableProperties: [
    'LimitedDescendantCount',
    'DistanceFromRoot',
    'DrillState',
    'LimitedRank'
  ],
  // Disallow sorting on these properties from Fiori UIs
  Capabilities.SortRestrictions.NonSortableProperties    : [
    'LimitedDescendantCount',
    'DistanceFromRoot',
    'DrillState',
    'LimitedRank'
  ],
) columns { // Ensure we can query these columns from the database
  null as LimitedDescendantCount : Int16,
  null as DistanceFromRoot       : Int16,
  null as DrillState             : String,
  null as LimitedRank            : Int16
};
