/***********************************
 *
 *  MAP ITEM
 *
 **/
window.Datea.MapItem = Backbone.Model.extend({
	urlRoot:"/api/v1/map_item/",
});

window.Datea.MapItemCollection = Backbone.Collection.extend({
	
	model: Datea.MapItem,
	url:"/api/v1/map_item/",
	
	pagination : function(perPage, page) {
       var result = _.rest(this.models, perPage*page);
       return _.first(result, perPage);    
    }
});


window.Datea.MapItemFullView = Backbone.View.extend({
	
	initialize: function () {
		this.model.bind('change', this.change_event, this);
		this.model.bind('sync', this.change_event, this);
	},
	
	render: function() {
		
		var context = this.model.toJSON();
		// hydrate context 
		context.created = formatDateFromISO(context.created, "dd.mm.yyyy - H:MM");
		context.content = context.content.replace(/\n/g, '<br />');
		context.full_url = get_base_url() + this.model.get('url');
		context.tweet_text = this.model.get('extract');
		context.hashtag = this.options.mappingModel.get('hashtag');
		context.mapping_active = this.options.mappingModel.get('mapping_active');
		this.$el.html( ich.map_item_full_tpl(context) );
		
		// images
		if (context.images && context.images.length > 0) {
			this.$el.find('.images').html(new Datea.ThumbRow({ model: this.model}).render().el);
		}
		
		// can edit?
		if (Datea.is_logged() && (
			this.options.mappingModel.get('user').id == Datea.my_user.get('id')
			|| Datea.my_user.get('id') == this.model.get('user').id
			|| Datea.my_user.get('is_staff'))){
				this.$el.find('.item-control').removeClass('hide');
		}
		
		// has position?
		if (!this.model.get('position') || !this.model.get('position').coordinates) {
			this.$el.find('.open-popup').hide();
		}
		
		// get replies
		var responses = new Datea.MapItemResponseCollection();
		var self = this;
		responses.fetch({
			data: {map_items__in: this.model.get('id'), order_by:'created'},
			success: function (collection, response) {
				if (collection.length > 0) {
					var $replies = self.$el.find('.replies');
					_.each(collection.models, function(model){
						$replies.append(new Datea.MapItemResponseView({model: model}).render().el); 
					});
					$replies.show();
				}
			}
		})
		
		// comments
		this.comments = new Datea.CommentCollection();
		var self = this;
		this.comment_view = new Datea.CommentsView({
			el: this.$el.find('.comments'),
			model: this.comments,
			object_type: 'dateamapitem',
			object_id: this.model.get('id'),
			callback: function () {
				self.model.set({comment_count: (self.model.get('comment_count') + 1)});
			}
		})
		this.comments.fetch({
			data: {'object_type': 'dateamapitem', 'object_id': this.model.get('id'), order_by: 'created'} 
		});
		
		//***************
		// widgets
		var $widgets = this.$el.find('.datea-widgets');
		
		// FOLLOW WIDGET
		this.follow_widget = new Datea.FollowWidgetView({
			object_type: 'dateamapitem',
			object_id: this.model.get('id'),
			object_name: gettext('report'),
			followed_model: this.model,
			type: 'full',
			style: 'full-small', 
		});
		$widgets.append(this.follow_widget.render().el);
		
		
		// VOTE WIDGET
		this.vote_widget = new Datea.VoteWidgetView({
			object_type: 'dateamapitem',
			object_id: this.model.get('id'),
			object_name: gettext('report'),
			voted_model: this.model,
			style: 'full-small' 
		});
		$widgets.append(this.vote_widget.render().el);
		
		return this;
	},
	
	change_event: function(ev){
		this.render();
		init_share_buttons();
	},
	
	clean_up: function () {
		this.$el.unbind();
        this.$el.remove();
	}
	
});


window.Datea.MapItemTeaserView = Backbone.View.extend({
	
	tagName: 'div',
	attributes: {
		"class" : "map-item teaser",
	},
	
	initialize: function () {
		this.model.bind('sync', this.render, this);
		this.model.bind('change', this.render, this);
		this.attributes.id = 'map-item-teaser-'+this.model.get('id');
	},
	
	render: function() {
		
		var context = this.model.toJSON();
		// hydrate context 
		context.created = formatDateFromISO(context.created, "dd.mm.yyyy - H:MM");
		this.$el.html( ich.map_item_teaser_tpl(context) );
		Datea.CheckStatsPlural(this.$el, this.model);
		
		// has position?
		if (!this.model.get('position') || !this.model.get('position').coordinates) {
			this.$el.find('.open-popup').hide();
		}
		
		return this;
	},
	
	clean_up: function () {
		this.$el.unbind();
        this.$el.remove();
	}
	
});



window.Datea.MapItemPopupView = Backbone.View.extend({
	
	tagName: 'div',
	
	events: {
		'click .popup-zoom': 'zoom',
	},
	
	initialize: function () {
		this.model.bind('sync', this.render, this);
		this.model.bind('change', this.render, this);
	},
	
	render: function() {
		
		var context = this.model.toJSON();
		// hydrate context 
		context.created = formatDateFromISO(context.created, "dd.mm.yyyy - H:MM");
		this.$el.html( ich.map_item_popup_tpl(context) );
		Datea.CheckStatsPlural(this.$el, this.model);
		return this;
	},
	
	zoom: function(ev) {
		ev.preventDefault();
		this.options.mapLayer.open_popup( this.model.get('id') , true, true);
	},
	
	clean_up: function () {
		this.$el.unbind();
        this.$el.remove();
	}
	
});






